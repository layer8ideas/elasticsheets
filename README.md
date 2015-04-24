# ElasticSheets v0.2
Organize lots of stuff.

## Requirements
ElasticSearch
https://www.elastic.co/


## Configuration

```javascript
exports.sheets = [ {

          id: "rs",
          header: "Servers",
          columns: [
                                labelColumn("label", "Label"),
                                optionsColumn("type", "Type", { options:["Linux","Network","Other"] } ),
                                textColumn("hostname", "Hostname", {width:250}),
                                lookupColumn("hosts", "Hosts", "ws", {lookup_multi:true, width:300} )
                                ]
  },{
          id: "ws",
          header: "Web Services",
          columns: [
                                labelColumn("label", "Label"),
                                optionsColumn("type", "Type", { options:ws_types, drop_down:true, } ),
                                optionsColumn("prodlevel", "Prod Level", { options:["Prod","PreProd"], drop_down:true, } ),
                                lookupColumn("hosts", "Hosted On", "rs", {width:300} )
                                ]

  } ];
```
## Installation
1.  Install & Start ElasticSearch (Apache 2.0)
https://www.elastic.co/downloads/elasticsearch
2. Download & Start ElasticSheets 0.2
http://www.elasticsheets.org/download/elasticsheets-0.2.tar.gz
3. Create a config.js or copy the sample under src/pubic/
4.  Run
# src/elasticsheets start
5. Browse
http://your-server.com:3000/
