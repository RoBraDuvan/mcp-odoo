import xmlrpc from 'xmlrpc';
import https from 'https';

export class OdooClient {
  constructor(config) {
    this.url = config.url;
    this.db = config.database;
    this.username = config.username;
    this.password = config.password;
    this.uid = null;

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

  async authenticate() {
    if (this.uid) {
      return this.uid;
    }

    const client = this.createClient('/xmlrpc/2/common');

    return new Promise((resolve, reject) => {
      client.methodCall('authenticate', [
        this.db,
        this.username,
        this.password,
        {}
      ], (error, uid) => {
        if (error) {
          reject(new Error(`Authentication failed: ${error.message}`));
        } else if (!uid) {
          reject(new Error('Authentication failed: Invalid credentials'));
        } else {
          this.uid = uid;
          resolve(uid);
        }
      });
    });
  }

  async execute_kw(model, method, args = [], kwargs = {}) {
    await this.authenticate();

    const client = this.createClient('/xmlrpc/2/object');

    return new Promise((resolve, reject) => {
      client.methodCall('execute_kw', [
        this.db,
        this.uid,
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

  async search(model, domain = [], options = {}) {
    const kwargs = {
      offset: options.offset || 0,
      limit: options.limit || 100,
    };

    if (options.order) {
      kwargs.order = options.order;
    }

    return this.execute_kw(model, 'search', [domain], kwargs);
  }

  async searchRead(model, domain = [], fields = [], options = {}) {
    const kwargs = {
      fields: fields,
      offset: options.offset || 0,
      limit: options.limit || 100,
    };

    if (options.order) {
      kwargs.order = options.order;
    }

    return this.execute_kw(model, 'search_read', [domain], kwargs);
  }

  async read(model, ids, fields = []) {
    const kwargs = fields.length > 0 ? { fields: fields } : {};
    return this.execute_kw(model, 'read', [ids], kwargs);
  }

  async create(model, values) {
    return this.execute_kw(model, 'create', [values]);
  }

  async write(model, ids, values) {
    return this.execute_kw(model, 'write', [ids, values]);
  }

  async unlink(model, ids) {
    return this.execute_kw(model, 'unlink', [ids]);
  }

  async fieldsGet(model, fields = [], attributes = []) {
    const kwargs = {};
    if (attributes.length > 0) {
      kwargs.attributes = attributes;
    }
    return this.execute_kw(model, 'fields_get', fields.length > 0 ? [fields] : [], kwargs);
  }

  async searchCount(model, domain = []) {
    return this.execute_kw(model, 'search_count', [domain]);
  }
}
