var Utils = require("../../utils")
  , util  = require("util")

module.exports = (function() {
  var QueryGenerator = {
    createTableQuery: function(tableName, attributes, options) {
      options = options || {}

      var query       = "CREATE TABLE IF NOT EXISTS <%= table %> (<%= attributes%>)"
        , primaryKeys = []
        , attrStr     = Utils._.map(attributes, function(dataType, attr) {
            if (Utils._.includes(dataType, 'PRIMARY KEY')) {
              primaryKeys.push(attr)
              return Utils.addTicks(attr) + " " + dataType.replace(/PRIMARY KEY/, '')
            } else {
              return Utils.addTicks(attr) + " " + dataType
            }
          }).join(", ")
        , values = {
            table: Utils.addTicks(tableName),
            attributes: attrStr,
            charset: (options.charset ? "DEFAULT CHARSET=" + options.charset : "")
          }
        , pkString = primaryKeys.map(function(pk) {return Utils.addTicks(pk)}).join(", ")

      if(pkString.length > 0) values.attributes += ", PRIMARY KEY (" + pkString + ")"

      return Utils._.template(query)(values).trim() + ";"
    },

    showTablesQuery: function() {
      return "SELECT name FROM sqlite_master WHERE type='table';"
    },

    deleteQuery: function(tableName, where, options) {
      options = options || {}

      var query = "DELETE FROM <%= table %> WHERE <%= where %>"
      var replacements = {
        table: Utils.addTicks(tableName),
        where: this.getWhereConditions(where),
        limit: Utils.escape(options.limit)
      }

      return Utils._.template(query)(replacements)
    },

    attributesToSQL: function(attributes) {
      var result = {}

      Utils._.map(attributes, function(dataType, name) {
        if(Utils.isHash(dataType)) {
          var template     = "<%= type %>"
            , replacements = { type: dataType.type }

          if(dataType.hasOwnProperty('allowNull') && !dataType.allowNull && !dataType.primaryKey)
            template += " NOT NULL"

          if(dataType.defaultValue != undefined) {
            template += " DEFAULT <%= defaultValue %>"
            replacements.defaultValue = Utils.escape(dataType.defaultValue)
          }

          if(dataType.unique) template += " UNIQUE"
          if(dataType.primaryKey) template += " PRIMARY KEY"

          result[name] = Utils._.template(template)(replacements)
        } else {
          result[name] = dataType
        }
      })

      return result
    },

    findAutoIncrementField: function(factory) {
      var fields = Utils._.map(factory.attributes, function(definition, name) {
        var isAutoIncrementField = (definition && (definition.indexOf('AUTOINCREMENT') == 0))
        return isAutoIncrementField ? name : null
      })

      return Utils._.compact(fields)
    }
  }

  var MySqlQueryGenerator = Utils._.extend(
    Utils._.clone(require("../query-generator")),
    Utils._.clone(require("../mysql/query-generator"))
  )

  return Utils._.extend(MySqlQueryGenerator, QueryGenerator)
})()
