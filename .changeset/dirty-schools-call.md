---
'hive': major
---

Docker Compose: Upgrade the PostgreSQL version for Docker Compose from version 14.13 to use 16.4. This change is published as major, as it requires attention based on your setup. 

For self-hosters with a managed database, we recommend upgrading PostgreSQL based on your Cloud provider's or IT's
recommendation. 

For self-hosters running in Docker, you can read about [upgrading PostgreSQL in a Docker container here](https://helgeklein.com/blog/upgrading-postgresql-in-docker-container/).

> The Hive data that was previously created with PostgreSQL v14 is compatible with v16. 
