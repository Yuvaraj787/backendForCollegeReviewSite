const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors({
    origin:'*',
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}));
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
const pg = require('pg');
const conn = new pg.Client("postgres://klwyredc:7obkBnHItn2T4Hb5MVjh6rXhN5cP8TP9@hansken.db.elephantsql.com/klwyredc");
conn.connect((err)=>{
    if (err) {
      console.log("error:"+err);
    } else { console.log("connected"); }
  });
function generateRandom() {
  return Math.round(Math.random()*100000);
}
function add_qn_to_user_table(qnId,username) {
       conn.query("update userTable set questionsAsked=array_append(questionsAsked,$1) where username=$2",[qnId,username],(err)=>{
        if (err) {console.log("Error in last step in update qn to user Table:"+err.message);}
        else {console.log("Succesfully updated the qn to the user table");}
       })
}
function add_ans_to_user_and_qn_table(qnId,ansId,username) {
  conn.query("update userTable set answered=array_append(answered,$1) where username=$2",[ansId,username],(err)=>{
   if (err) {console.log("Error in last update ansId to user Table:"+err.message);}
   else {console.log("Succesfully updated the AnsId to the user table");}
  })
  conn.query("update questionTable set ansby=array_append(ansby,$1) where qnid=$2",[ansId,qnId],(err)=>{
    if (err) {console.log("Error in update ansId to Qn Table:"+err.message);}
    else {console.log("Succesfully updated the AnsId to the qn table");}
   })
}
app.post("/createUser",(req,res)=>{
  const userId = generateRandom();
  console.log(req.body);
  const {username,currentStatus,institute,classs,password} = req.body;
  conn.query("insert into userTable (userId,username,currentStatus,Institute,class,password,questionsAsked,answered) values ($1,$2,$3,$4,$5,$6,$7,$8)",
  [userId,username,currentStatus,institute,classs,password,[],[]],(err)=>{
    if (err) {console.log("error in posting:"+err.message);}
    else {console.log("added successfully")
    res.redirect("https://college-review-site.vercel.app/login");}
  })
})
app.route("/questions")
.post((req,res)=>{
  const qnid = generateRandom();
  const {qnhead,qnpart,byName} = req.body;
  conn.query("insert into questionTable (qnid,qnHead,qnpart,ansby,byname) values ($1,$2,$3,$4,$5)",[qnid,qnhead,qnpart,[],byName],(err)=>{
    if (err) {console.log("error in adding question");}
    else {
     console.log("Succesfully added the questions");
  add_qn_to_user_table(qnid,byName);
  res.redirect("https://college-review-site.vercel.app/")
     }
  })
})
.get((req,res)=>{
  conn.query("select * from questionTable",(err,docs)=>{
    if (err) {console.log("error in deliver questions");}
    else {console.log("questions rendered successfully")
    res.json(docs.rows);}
   }) 
})
app.get("/loginverify/:username/:password",(req,res)=>{
  const {username,password} = req.params;
  console.log(req.params)
  // conn.query("select username from ")
  // check the username in the database and then check password
  // lets finish this tommorow
  // done
  conn.query("select * from usertable where username=$1",[username],(err,docs)=>{
    if (err) { console.log("Error in verifying login"); }
    else {
     if (docs.rows[0].username == username && docs.rows[0].password == password) {
      console.log("turquoise");
         res.json({
          correct:true,
          uname:username,
          pwd:password
         })
     } else {
      console.log("false");
      res.json({
        correct:false
      })
     }
  }
  })
})
app.route("/answers")
.post((req,res)=>{
  const ansId = generateRandom();
  const {qnId,ansPart,byName} = req.body;
  conn.query("insert into answerTable (ansId,ansPart,byName) values ($1,$2,$3)",[ansId,ansPart,byName],(err)=>{
    if (err) {console.log("error in adding answe table: " + err.message);}
    else {
      add_ans_to_user_and_qn_table(qnId,ansId,byName);
      console.log("added in answer table");
      res.redirect('https://college-review-site.vercel.app/')
  }
  });
})
.get((req,res)=>{
   conn.query("select * from ")
})
app.post("/check",(req,res)=>{
  const thatname = req.query.username;
  // console.log(thatname);
  conn.query("select * from userTable where username=$1",[thatname],(err,docs)=>{
    if (err) {
      console.log("Error in checking data");
    } else {
      if (docs.rowCount==0) {
        res.json({"isnewname":true});
      } else {
        res.json({"isnewname":false});
      }
    }
  })
})
app.get("/profile/:username",(req,res)=>{
  console.log(req.params.username);
  conn.query("select userId,username,currentStatus,Institute,class,questionsAsked,answered from usertable where username=$1",[req.params.username],(err,docs)=>{
    if (err) {console.log("Error in getting profile: "+err.message);}
    else { 
      console.log(docs.rows)
      res.json(docs.rows[0])
     }
  })
})
app.post("/getansid",(req,res)=>{
  const qid = req.query.qid;
  conn.query("select ansby from questionTable where qnId=$1",[qid],(err,docs)=>{
    if (err) {
      console.log("Error in getting answer IDs");
    }
    else {
      console.log(docs.rows[0]);
      conn.query("select * from answerTable where ansId = any($1)",[docs.rows[0].ansby],(err,docs2)=>{
        if (err) { console.log("Error in getting answers: "+err.message); }
        else { 
          // console.log(docs2.rows);
          res.json(docs2.rows) 
        }
      })
    }
  })
})
app.listen(process.env.PORT,()=>{
    console.log("server is running boss on port 5000");
})
