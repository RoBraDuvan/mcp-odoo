# MCP Odoo Server

Un servidor MCP (Model Context Protocol) para integración con la API de Odoo mediante XML-RPC.

## Características

- Autenticación automática con Odoo
- Operaciones CRUD completas (Create, Read, Update, Delete)
- Búsqueda y filtrado con dominios de Odoo
- Obtención de metadatos de campos
- Soporte para HTTP y HTTPS

## Instalación

```bash
npm install
```

## Configuración

El servidor utiliza variables de entorno para la configuración de conexión a Odoo:

- `ODOO_URL`: URL de tu instancia de Odoo (default: `http://localhost:8069`)
- `ODOO_DATABASE`: Nombre de la base de datos (default: `odoo`)
- `ODOO_USERNAME`: Usuario de Odoo (default: `admin`)
- `ODOO_PASSWORD`: Contraseña del usuario (default: `admin`)

### Configuración en Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**En MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**En Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Agrega el servidor MCP:

```json
{
  "mcpServers": {
    "odoo": {
      "command": "node",
      "args": ["C:\\Users\\Duván Andrés\\Documents\\proyectos\\tools\\mcp\\index.js"],
      "env": {
        "ODOO_URL": "https://tu-instancia.odoo.com",
        "ODOO_DATABASE": "tu_base_de_datos",
        "ODOO_USERNAME": "tu_usuario",
        "ODOO_PASSWORD": "tu_contraseña"
      }
    }
  }
}
```

## Herramientas Disponibles

### odoo_search
Busca registros en un modelo de Odoo y retorna sus IDs.

**Parámetros:**
- `model` (requerido): Nombre del modelo de Odoo (ej: "res.partner", "sale.order")
- `domain`: Array de filtros [["campo", "operador", "valor"]]
- `limit`: Número máximo de registros (default: 100)
- `offset`: Número de registros a saltar (default: 0)
- `order`: Ordenamiento (ej: "name ASC")

**Ejemplo:**
```json
{
  "model": "res.partner",
  "domain": [["is_company", "=", true]],
  "limit": 10
}
```

### odoo_search_read
Busca y lee registros en una sola operación.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `domain`: Array de filtros
- `fields`: Array de campos a retornar (vacío retorna todos)
- `limit`: Número máximo de registros
- `offset`: Número de registros a saltar
- `order`: Ordenamiento

**Ejemplo:**
```json
{
  "model": "res.partner",
  "domain": [["email", "!=", false]],
  "fields": ["name", "email", "phone"],
  "limit": 5
}
```

### odoo_read
Lee registros específicos por sus IDs.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `ids` (requerido): Array de IDs a leer
- `fields`: Array de campos a retornar

**Ejemplo:**
```json
{
  "model": "res.partner",
  "ids": [1, 2, 3],
  "fields": ["name", "email"]
}
```

### odoo_create
Crea un nuevo registro.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `values` (requerido): Objeto con los valores del nuevo registro

**Ejemplo:**
```json
{
  "model": "res.partner",
  "values": {
    "name": "Nuevo Cliente",
    "email": "cliente@example.com",
    "phone": "+1234567890"
  }
}
```

### odoo_write
Actualiza registros existentes.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `ids` (requerido): Array de IDs a actualizar
- `values` (requerido): Objeto con los nuevos valores

**Ejemplo:**
```json
{
  "model": "res.partner",
  "ids": [1],
  "values": {
    "phone": "+9876543210"
  }
}
```

### odoo_delete
Elimina registros.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `ids` (requerido): Array de IDs a eliminar

**Ejemplo:**
```json
{
  "model": "res.partner",
  "ids": [1, 2]
}
```

### odoo_fields_get
Obtiene las definiciones de campos de un modelo.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `fields`: Array de nombres de campos específicos
- `attributes`: Array de atributos a retornar

**Ejemplo:**
```json
{
  "model": "res.partner",
  "fields": ["name", "email"],
  "attributes": ["string", "type", "required"]
}
```

### odoo_search_count
Cuenta los registros que coinciden con un dominio.

**Parámetros:**
- `model` (requerido): Nombre del modelo
- `domain`: Array de filtros

**Ejemplo:**
```json
{
  "model": "sale.order",
  "domain": [["state", "=", "sale"]]
}
```

## Dominios de Búsqueda

Los dominios en Odoo utilizan notación polaca prefija. Ejemplos:

```javascript
// AND implícito
[["name", "ilike", "John"], ["email", "!=", false]]

// OR explícito
["|", ["name", "=", "John"], ["name", "=", "Jane"]]

// Combinación compleja
["&", ["is_company", "=", true], "|", ["country_id", "=", "US"], ["country_id", "=", "CA"]]
```

## Operadores Comunes

- `=`: igual
- `!=`: diferente
- `>`: mayor que
- `<`: menor que
- `>=`: mayor o igual
- `<=`: menor o igual
- `like`: contiene (sensible a mayúsculas)
- `ilike`: contiene (insensible a mayúsculas)
- `in`: está en la lista
- `not in`: no está en la lista

## Desarrollo

```bash
# Modo desarrollo con recarga automática
npm run dev

# Iniciar normalmente
npm start
```

## Modelos Comunes de Odoo

- `res.partner`: Contactos/Clientes
- `sale.order`: Órdenes de venta
- `purchase.order`: Órdenes de compra
- `product.product`: Productos
- `account.move`: Facturas/Asientos contables
- `stock.picking`: Transferencias de inventario
- `crm.lead`: Oportunidades CRM
- `project.project`: Proyectos
- `hr.employee`: Empleados

## Notas de Seguridad

- Nunca compartas tus credenciales de Odoo
- Usa variables de entorno para configuración sensible
- Considera usar tokens de API si tu versión de Odoo lo soporta
- Limita los permisos del usuario de integración a solo lo necesario

## Solución de Problemas

### Error de autenticación
Verifica que:
- La URL de Odoo sea correcta
- El nombre de la base de datos sea exacto
- Las credenciales sean válidas
- El usuario tenga permisos de acceso API

### Error de conexión
- Verifica que Odoo esté accesible desde tu máquina
- Comprueba firewalls y configuración de red
- Para HTTPS, verifica certificados SSL válidos

## Licencia

MIT
