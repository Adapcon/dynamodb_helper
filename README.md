# dynamodb_helper
A collection of scripts to help manage DynamoDB records.

The design is very human

## installation
just run 

```bash
npm i 
```
You'll also need to configure your AWS CLI credentials.
When these things are done, you're good to go


## Scripts
### deleteScan
#### usage
```bash
npm run deleteScan
```
![image](https://user-images.githubusercontent.com/14003652/214305638-8f1788c4-d243-46ec-a2e5-e7daf49ad1c8.png)

In order to pass parameters to npm, add the double dash (--)
Ex:
```bash
npm run deleteScan -- -t Store.Product -a stage-amc --pk appId --sk productId -v
```

