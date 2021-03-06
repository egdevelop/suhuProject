const express = require("express");
const db = require('./../config/db');
const router = express.Router();
const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);
const fetch = require('node-fetch');
const exportData = require(`./file`);

app.use(function(req,res,next){
    req.io = io;
    next();
})

router.post("/excel",(req,res)=>{
    const {dari,sampai} = req.body;
    db.query("SELECT * FROM dataSuhu WHERE waktu BETWEEN ? AND ?",[dari,sampai],(err,hasil)=>{
        const columnName = [
            "Waktu",
            "Suhu1",
            "Suhu2",
            "Suhu3",
            "Suhu4"
        ];
        const tanggal = new Date();
        const workSheetName = "Output Suhu";
        const filePath = './public/xlsx/'+ tanggal + dari + '-' + sampai + '.xlsx'
        const mysqlPath =  '/xlsx/'+ tanggal + dari + '-' + sampai + '.xlsx'
        if(hasil){
            exportData(hasil,columnName,workSheetName,filePath);
            db.query("INSERT INTO dataexcel (nama)VALUES(?)",[mysqlPath],(err,result)=>{
                if(result){
                    res.status(200).json({
                        pesan: "sukses",
                        link: mysqlPath
                    })
                req.io.sockets.emit("download", result);
                }else{
                    res.status(501).json(err);
                }
            })
        }else{
            res.status(501).json({
                dari : dari,
                sampai: sampai
            });
        }
    })
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
            const icon = {
                icon1: 0,
                icon2: 0,
                icon3: 0,
                icon4: 0,
            };
            db.query("SELECT * FROM dataSuhu ORDER BY id DESC LIMIT 1;",(err,result)=>{
                if(result){
                    if(result[0].suhu1 >= hasil[0].suhu1){
                        icon.icon1 = 1;
                    }
                    if(result[0].suhu2 >= hasil[0].suhu2){
                        icon.icon2 = 1;
                    }
                    if(result[0].suhu3 >= hasil[0].suhu3){
                        icon.icon3 = 1;
                    }
                    if(result[0].suhu4 >= hasil[0].suhu4){
                        icon.icon4 = 1;
                    }
                    if(result[0].suhu1 <= hasil[1].suhu1){
                        icon.icon1 = 2;
                    }
                    if(result[0].suhu2 <= hasil[1].suhu2){
                        icon.icon2 = 2;
                    }
                    if(result[0].suhu3 <= hasil[1].suhu3){
                        icon.icon3 = 2;
                    }
                    if(result[0].suhu4 <= hasil[1].suhu4){
                        icon.icon4 = 2;
                    }
                    res.status(200).json({
                        hasils: hasil,
                        icons: icon,
                    });
                }else{
                    res.status(500).json(err);
                }
            })
        }else{
            res.status(501).json(err);
        }
    })
})
router.post("/tusuk",(req,ress)=>{
    const { suhu1,suhu2,suhu3,suhu4 } = req.body;
    const waktu = new Date();
    const LED = {
        led1: 0,
        led2: 0,
        led3: 0,
        led4: 0,
    };
    db.query("SELECT * FROM alarm",(err,data)=>{
        if(suhu1 >= data[0].suhu1 || suhu2 >= data[0].suhu2 || suhu3 >= data[0].suhu3 || suhu4 >= data[0].suhu4){
            if(suhu1 >= data[0].suhu1){
                LED.led1 = 1;
            }
            if(suhu2 >= data[0].suhu2){
                LED.led2 = 1;
            }
            if(suhu3 >= data[0].suhu3){
                LED.led3 = 1;
            }
            if(suhu4 <= data[0].suhu4){
                LED.led4 = 1;
            }
            let pesan =`Hallo Temperatur Sistem Monitoring admin Suhu max Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }
        if(suhu1 <= data[1].suhu1 || suhu2 <= data[1].suhu2 || suhu3 <= data[1].suhu3 || suhu4 <= data[1].suhu4){
            if(suhu1 <= data[1].suhu1){
                LED.led1 = 2;
            }
            if(suhu2 <= data[1].suhu2){
                LED.led2 = 2;
            }
            if(suhu3 <= data[1].suhu3){
                LED.led3 = 2;
            }
            if(suhu4 <= data[1].suhu4){
                LED.led4 = 2;
            }
            let pesan =`Hallo Temperatur Sistem Monitoring admin Suhu Min Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }


    })
    db.query("INSERT INTO dataSuhu (waktu,suhu1,suhu2,suhu3,suhu4)VALUES(?,?,?,?,?)", [waktu,suhu1,suhu2,suhu3,suhu4],(err,hasil)=>{
        if(hasil){
            ress.status(200).json(LED);
                req.io.sockets.emit("update", hasil);
        }else{
            ress.status(501).json({
                suhu1 : suhu1,
                suhu2: suhu2,
                suhu3: suhu3,
                suhu4: suhu4
            });
        }
    })


});
router.get("/tusuk/:suhu1/:suhu2/:suhu3/:suhu4",(req,ress)=>{
    const { suhu1,suhu2,suhu3,suhu4 } = req.params;
    const waktu = new Date();
    const LED = {
        led1: 0,
        led2: 0,
        led3: 0,
        led4: 0,
    };
    db.query("SELECT * FROM alarm",(err,data)=>{
        if(suhu1 >= data[0].suhu1 || suhu2 >= data[0].suhu2 || suhu3 >= data[0].suhu3 || suhu4 >= data[0].suhu4){
            if(suhu1 >= data[0].suhu1){
                LED.led1 = 1;
            }
            if(suhu2 >= data[0].suhu2){
                LED.led2 = 1;
            }
            if(suhu3 >= data[0].suhu3){
                LED.led3 = 1;
            }
            if(suhu4 <= data[0].suhu4){
                LED.led4 = 1;
            }
            let pesan =`Hallo Temperatur Sistem Monitoring admin Suhu max Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }
        if(suhu1 <= data[1].suhu1 || suhu2 <= data[1].suhu2 || suhu3 <= data[1].suhu3 || suhu4 <= data[1].suhu4){
            if(suhu1 <= data[1].suhu1){
                LED.led1 = 2;
            }
            if(suhu2 <= data[1].suhu2){
                LED.led2 = 2;
            }
            if(suhu3 <= data[1].suhu3){
                LED.led3 = 2;
            }
            if(suhu4 <= data[1].suhu4){
                LED.led4 = 2;
            }
            let pesan =`Hallo Temperatur Sistem Monitoring admin Suhu Min Tercapai:\nSUHU 1 :${suhu1}\nSUHU 2: ${suhu2}\nSUHU 3: ${suhu3}\nSUHU 4: ${suhu4}`
            fetch("https://api.telegram.org/bot1574618477:AAEeS6hl1xU1YHh_8th93Kn_xIBxhXjNHE4/sendMessage?parse_mode=markdown&chat_id=1317328543&text="+ pesan);
        }


    })
    db.query("INSERT INTO dataSuhu (waktu,suhu1,suhu2,suhu3,suhu4)VALUES(?,?,?,?,?)", [waktu,suhu1,suhu2,suhu3,suhu4],(err,hasil)=>{
        if(hasil){
            ress.status(200).json(LED);
                req.io.sockets.emit("update", hasil);
        }else{
            ress.status(501).json({
                suhu1 : suhu1,
                suhu2: suhu2,
                suhu3: suhu3,
                suhu4: suhu4
            });
        }
    })

});


module.exports = router;