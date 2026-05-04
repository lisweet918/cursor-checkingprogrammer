const db = uniCloud.database();
db.collection('wx_users').get().then(res => {
  console.log("Users:", res.result.data);
}).catch(console.error);
