# RBAC (Rule-Based Access Control)

## Prequisites (Development):

| Module | Version |
| --- | --- |
| Node | 14.18.3 |
| Npm | 8.5.4 |


##### Take Clone of project
> git clone -b git_url  folder_name


##### Rename configSample.js to configs.js
> cd configs
> mv configSample.js configs.js

##### Change the url of database and set credential if applicable
> vi configs.js

##### Install node modules

> npm install

##### Deployment

> pm2 start server.js --name="rbac_staging_api"
> pm2 start server.js --name="rbac_dev_api"

