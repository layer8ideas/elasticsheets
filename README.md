# ElasticSheets v0.2
Organize lots of stuff.

## Requirements
ElasticSearch
https://www.elastic.co/

Webix
http://webix.com/


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
2. Download NodeJS
https://nodejs.org/download/
3. Download Webix (GPLv3)
http://webix.com/download-webix-gpl/
4.  Place webix folder under /public
5.  Configure public/config.js (copy config.js.sample)
6.  Bootstrap NodeJS/Express
# npm install
7.  Run
# node app.js
8. Browse
http://your-server.com:3000/
