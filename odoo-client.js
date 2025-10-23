import xmlrpc from 'xmlrpc';
import https from 'https';

export class OdooClient {
  constructor(config) {
    this.url = config.url;
    this.username = config.username;
    this.password = config.password;
    this.uidCache = {}; // Cache UIDs by database

    // Parse URL to get host and port
    const urlObj = new URL(this.url);
    this.host = urlObj.hostname;
    this.port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
    this.secure = urlObj.protocol === 'https:';
  }

  createClient(path) {
    const options = {
      host: this.host,
      port: this.port,
      path: path,
    };

    // Add custom agent to accept self-signed certificates if HTTPS
    if (this.secure) {
      options.agent = new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates
      });
    }

    return this.secure
      ? xmlrpc.createSecureClient(options)
      : xmlrpc.createClient(options);
  }

  async authenticate(database) {
    if (this.uidCache[database]) {
      return this.uidCache[database];
    }

    const client = this.createClient('/xmlrpc/2/common');

    return new Promise((resolve, reject) => {
      client.methodCall('authenticate', [
        database,
        this.username,
        this.password,
        {}
      ], (error, uid) => {
        if (error) {
          reject(new Error(`Authentication failed: ${error.message}`));
        } else if (!uid) {
          reject(new Error('Authentication failed: Invalid credentials'));
        } else {
          this.uidCache[database] = uid;
          resolve(uid);
        }
      });
    });
  }

  async execute_kw(database, model, method, args = [], kwargs = {}) {
    const uid = await this.authenticate(database);

    const client = this.createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', [
        database,
        uid,
        this.password,
        model,
        method,
        args,
        kwargs
      ], (error, result) => {
        if (error) {
          reject(new Error(`Odoo API error: ${error.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  async search(database, model, domain = [], options = {}) {
    const kwargs = {
      offset: options.offset || 0,
      limit: options.limit || 100,
    };

    if (options.order) {
      kwargs.order = options.order;
    }

    return this.execute_kw(database, model, 'search', [domain], kwargs);
  }

  async searchRead(database, model, domain = [], fields = [], options = {}) {
    const kwargs = {
      fields: fields,
      offset: options.offset || 0,
      limit: options.limit || 100,
    };

    if (options.order) {
      kwargs.order = options.order;
    }

    return this.execute_kw(database, model, 'search_read', [domain], kwargs);
  }

  async read(database, model, ids, fields = []) {
    const kwargs = fields.length > 0 ? { fields: fields } : {};
    return this.execute_kw(database, model, 'read', [ids], kwargs);
  }

  async create(database, model, values) {
    return this.execute_kw(database, model, 'create', [values]);
  }

  async write(database, model, ids, values) {
    return this.execute_kw(database, model, 'write', [ids, values]);
  }

  async unlink(database, model, ids) {
    return this.execute_kw(database, model, 'unlink', [ids]);
  }

  async fieldsGet(database, model, fields = [], attributes = []) {
    const kwargs = {};
    if (attributes.length > 0) {
      kwargs.attributes = attributes;
    }
    return this.execute_kw(database, model, 'fields_get', fields.length > 0 ? [fields] : [], kwargs);
  }

  async searchCount(database, model, domain = []) {
    return this.execute_kw(database, model, 'search_count', [domain]);
  }

  async listDatabases() {
    const client = this.createClient('/xmlrpc/2/db');

    return new Promise((resolve, reject) => {
      client.methodCall('list', [], (error, databases) => {
        if (error) {
          reject(new Error(`Failed to list databases: ${error.message}`));
        } else {
          resolve(databases);
        }
      });
    });
  }
}
