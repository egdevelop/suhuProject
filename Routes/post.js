const express = require("express");
const db = require('./../config/db');
const router = express.Router();
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');

app.use(function(req,res,next){
    req.io = io;
    next();
})



router.get("/",(req,ress)=>{
    ress.send({
        Pesan : "ini adalah post router"
    });
});
router.get("/data",(req,ress)=>{
    db.query("SELECT * FROM dataSuhu",(err,hasil)=>{
        if(hasil){
            ress.status(200).json(hasil);
        }else{
            ress.status(501).json(err);
        }
    })
})
router.get("/data1",(req,ress)=>{
    db.query("SELECT * FROM dataSuhu ORDER BY id DESC",(err,hasil)=>{
        if(hasil){
            ress.status(200).json(hasil);
        }else{
            ress.status(501).json(err);
        }
    })
})
router.post("/pdf",(req,res)=>{
    const {dari,sampai} = req.body;
    db.query("SELECT * FROM dataSuhu WHERE waktu BETWEEN ? AND ?",[dari,sampai],(err,hasil)=>{
        if(hasil){
            res.render("pdf",{data:hasil});
        }else{
            res.status(501).json(err);
        }
    })
})
router.post("/alarm",(req,res)=>{
    const {max1,max2,max3,max4,min1,min2,min3,min4} = req.body;
    db.query("UPDATE alarm SET suhu1=?, suhu2=?, suhu3=?, suhu4=? WHERE id='1'",[max1,max2,max3,max4],(err,hasil)=>{
        if(hasil){
            db.query("UPDATE alarm SET suhu1=?, suhu2=?, suhu3=?, suhu4=? WHERE id='2'",[min1,min2,min3,min4],(err,result)=>{
                if(result){
                    res.status(200).json({
                        pesan1:"berhasil",
                        pesan2: "Min & Max Suhu berhasil diatur"
                    })
                }else{
                    res.status(500).json(err)
                }
            })
        }else{
            res.status(500).json(err)
        }
    })
})
router.get("/dataAlarm",(req,res)=>{
    db.query("SELECT * FROM alarm",(err,hasil)=>{
        if(hasil){
            res.status(200).json(hasil);
        }else{
            res.status(501).json(err);
        }
    })
})
router.post("/tusuk",(req,ress)=>{
    const { suhu1,suhu2,suhu3,suhu4 } = req.body;
    const waktu = new Date();
    db.query("INSERT INTO dataSuhu (waktu,suhu1,suhu2,suhu3,suhu4)VALUES(?,?,?,?,?)", [waktu,suhu1,suhu2,suhu3,suhu4],(err,hasil)=>{
        if(hasil){
            ress.status(200).json({
                pesan: 'Berhasil di query',
            });
                req.io.sockets.emit("update", hasil);
        }else{
            ress.status(501).json(err);
        }
    })
    db.query("SELECT * FROM alarm",(err,data)=>{
        if(suhu1 >= data[0].suhu1 || suhu2 >= data[0].suhu2 || suhu3 >= data[0].suhu3 || suhu4 >= data[0].suhu4){
            let pesan =`Hallo TMS admin Suhu max Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }
        if(suhu1 <= data[1].suhu1 || suhu2 <= data[1].suhu2 || suhu3 <= data[1].suhu3 || suhu4 <= data[1].suhu4){
            let pesan =`Hallo TMS admin Suhu Min Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }

    })


});


module.exports = router;