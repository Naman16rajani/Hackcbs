const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const ejs = require('ejs')
const webpush = require("web-push");
const schedule = require("node-schedule");
const accountSid = 'YOUR_ACCOUNTSID';
const authToken = 'YOUR_AUTHTOKEN';
const client = require('twilio')(accountSid, authToken);


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set("view-engine", "ejs");
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(sessions({
    secret: "SECRET_OF_YOURS.",
    resave: false,
    saveUninitialized: true

}));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());




var session;

var pool = mysql.createPool({
    host: 'HOST_LINK',
    user: 'USERNAME',
    password: 'PASSWORD',
    database: 'DATABASENAME'
});
let name;
let password;
let email;
let mobileno;
app.get('/', (req, res) => {
    session = req.session;
    // console.log(session);

    if (session.userid && session.password) {
        name = session.userid;
        password = session.password;
        email = session.email;
        mobileno = session.mobileno;
        res.redirect('/index.html');
    } else
        res.sendFile(__dirname + "/login.html");
});

app.post('/login', (req, res) => {
    name = req.body.name;
    password = req.body.password;
    pool.getConnection(function (err, con) {
        var sql;
        sql = "SELECT name, password FROM users";
        con.query(sql, function (err, result) {
            if (err) throw err;
            var i = 0,
                j = 0;
            for (i = 0; i < result.length; i++) {
                if (result[i].name === name && result[i].password === password) {
                    j = 1;
                    break;
                } else {
                    j = 0;
                }
            }
            if (j === 1) {
                session = req.session;
                session.userid = name;
                session.password = password;
                // console.log("b");
                // console.log(session);


                res.redirect('/index.html');

            } else {
                res.redirect('/');

            }

            con.release();

        });
    });
});
app.post('/sign-up', (req, res) => {
    name = req.body.name;
    password = req.body.password;
    email = req.body.email;
    mobileno = req.body.mobileno;
    pool.getConnection(function (err, con) {
        var sql;
        sql = "SELECT name, password FROM users";
        con.query(sql, function (err, result) {
            if (err) throw err;
            let i = 0,
                j = 0;
            for (i = 0; i < result.length; i++) {
                if (result[i].name === name) {
                    if (result[i].password === password) {
                        j = 1;
                        break;
                    } else {
                    }

                } else {
                    j = 0;
                }
            }
            if (j === 0) {
                sql = "INSERT INTO users (name, password,email,mobileno) VALUES ('" + name + "','" + password + "','" + email + "','" + mobileno + "')";
                con.query(sql, (err) => {
                    if (err) throw err;
                });
                session = req.session;
                session.userid = name;
                session.password = password;
                session.email = email;
                session.mobileno = mobileno;
                // console.log(req.session)
                res.redirect('/index.html');
            }

            con.release();

        });
    });

    // res.redirect('/');
});
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});


app.post("/docmap", (req, res) => {
    var die = req.body.deisease;
    // console.log(die);
    res.render("docmap.html", {
        placed: die,
        name: name,
        email: email,
        mobileno: mobileno,
        filename: "docmap.html"
    });
});

app.get('/:filename', (req, res) => {

    var filename = req.params.filename;

    if (filename.includes(".html")) {


        pool.getConnection(function (err, con) {
            var sql;
            sql = "SELECT * FROM users";
            con.query(sql, function (err, result) {
                if (err) throw err;
                var i = 0,
                    j = 0;
                for (i = 0; i < result.length; i++) {
                    if (result[i].name === name && result[i].password === password) {
                        j = 1;
                        mobileno = result[i].mobileno;
                        email = result[i].email;
                        break;
                    } else {
                        j = 0;
                    }
                }

                if (j === 1) {
                    session = req.session;
                    // console.log(session);
                    session.email = email;
                    session.mobileno = mobileno;
                    if (session.userid === name && session.password === password) {
                        res.render(filename, {
                            name: name,
                            email: email,
                            mobileno: mobileno,
                            notification: 0,
                            filename: filename,
                            write: 0

                        })
                    } else
                        res.redirect('/');
                } else {
                    res.redirect('/');

                }

                con.release();

            });
        });
    }
})
var someDate = new Date(2021, 10, 23, 15, 0, 0)
var data = "hello";
app.post('/notify', (req, res) => {
    console.log(req.body.datetime);
    console.log(req.body.nmess);
    someDate = req.body.datetime;
    data = req.body.nmess;


    schedule.scheduleJob(someDate, () => {

        client.messages
            .create({
                body: data,
                messagingServiceSid: 'SERVICE_SID',
                to: "+91" + mobileno
            })
            .then(message => console.log(message.sid))
            .done()
        console.log("message sent to: " + mobileno);

    });

    // res.render("services.html", {
    //     name: name,
    //     email: email,
    //     mobileno: mobileno,
    //     notification: 0,
    //
    //     filename: "services.html"
    // })
    res.redirect('/services.html');
})

app.post("/subscribe", (req, res) => {

    schedule.scheduleJob(someDate, () => {
        // Get pushSubscription object
        const subscription = req.body;

        // Send 201 - resource created
        res.status(201).json({});

        // Create payload
        const options = {
            TTL: 6,
            timeout: 5000


        };
        const payload = JSON.stringify({
            title: "HealthCare"
        });

        // Pass object into sendNotification
        webpush
            .sendNotification(subscription, payload, options)
            .catch(err => console.error(err));

    });


    // const subscription = req.body;
    // console.log(req.body);
    // // Send 201 - resource created
    // res.status(201).json({});
    //
    // // Create payload
    // const payload = JSON.stringify({ title: "Push naman" });
    //
    // // Pass object into sendNotification
    // webpush
    //     .sendNotification(subscription, payload)
    //     .catch(err => console.error(err));
});
var countries = [
    "Chicken pox",
    "Hepatitis",
    "Dengue",
    "Cholera",
    "Malaria",
    "Diabetes",
    "Cancer",
    "AIDS (Acquired Immuno Deficiency Syndrome)"
]
app.post('/tretment', (req, res) => {
    var f = {
        "Chicken pox": [
            "Use Acetaminophen (Tylenol) for Pain and Fever",
            "Tap or pat -- don’t scratch -- your itch\n" +
            "Take a cool oatmeal bath (you can buy it at your local drugstore). Dab or pat (don’t rub) your skin dry.\n" +
            "Wear loose, cotton clothing so your skin can breathe\n" +
            "Dab calamine lotion on your itchy spots\n" +
            "Try an antihistamine, like Benadryl, to ease your symptoms"
        ],
        "Hepatitis": [
            "Rest. Many people with hepatitis A infection feel tired and sick and have less energy.\n" +
            "Manage nausea. Nausea can make it difficult to eat. Try snacking throughout the day rather than eating full meals. To get enough calories, eat more high-calorie foods. For instance, drink fruit juice or milk rather than water. Drinking plenty of fluids is important to prevent dehydration if vomiting occurs.\n" +
            "Avoid alcohol and use medications with care. Your liver may have difficulty processing medications and alcohol. If you have hepatitis, don't drink alcohol. It can cause more liver damage. Talk to your doctor about all the medications you take, including over-the-counter drugs."
        ],
        "Dengue": [
            "Rest as much as possible.\n" +
            "Take acetaminophen (also known as paracetamol outside of the United States) to control fever and relieve pain.\n" +
            "Do not take aspirin or ibuprofen!\n" +
            "Drink plenty of fluids to stay hydrated. Drink water or drinks with added electrolytes.\n" +
            "For mild symptoms, care for a sick infant, child, or family member at home."
        ],
        "Cholera": [
            "Rehydration therapy, the primary treatment for cholera patients, refers to the prompt restoration of lost fluids and salts.\n" +
            "Antibiotic treatment reduces fluid requirements and duration of illness, and is indicated for severe cases of cholera.",
            "Zinc treatment"
        ],
        "Malaria": [

            "The most common antimalarial drugs include:\n" +
            "\n" +
            "Chloroquine phosphate. Chloroquine is the preferred treatment for any parasite that is sensitive to the drug. But in many parts of the world, parasites are resistant to chloroquine, and the drug is no longer an effective treatment.\n" +
            "Artemisinin-based combination therapies (ACTs). ACT is a combination of two or more drugs that work against the malaria parasite in different ways. This is usually the preferred treatment for chloroquine-resistant malaria. Examples include artemether-lumefantrine (Coartem) and artesunate-mefloquine.\n" +
            "Other common antimalarial drugs include:\n" +
            "\n" +
            "Atovaquone-proguanil (Malarone)\n" +
            "Quinine sulfate (Qualaquin) with doxycycline (Oracea, Vibramycin, others)\n" +
            "Primaquine phosphate"
        ],
        "Diabetes": [
            "While diabetes is incurable, a person can stay in remission for a long time.\n" +
            "\n" +
            "No cure for diabetes currently exists, but the disease can go into remission.\n" +
            "\n" +
            "When diabetes goes into remission, it means that the body does not show any signs of diabetes, although the disease is technically still present.\n" +
            "\n" +
            "Doctors have not come to a final consensus on what exactly constitutes remission, but they all include A1C levels below 6 percent as a significant factor. A1C levels indicate a person’s blood sugar levels over 3 months.\n" +
            "\n" +
            "According to Diabetes Care, remission can take different forms:\n" +
            "\n" +
            "Partial remission: When a person has maintained a blood glucose level lower than that of a person with diabetes for at least 1 year without needing to use any diabetes medication.\n" +
            "Complete remission: When the blood glucose level returns to normal levels completely outside of the range of diabetes or prediabetes and stays there for at least 1 year without any medications.\n" +
            "Prolonged remission: When complete remission lasts for at least 5 years.\n" +
            "Even if a person maintains normal blood sugar levels for 20 years, a doctor would still consider their diabetes to be in remission rather than cured.\n" +
            "\n" +
            "Achieving diabetes remission can be as simple as making changes to an exercise routine or diet."
        ],
        "Cancer": [
            "Common types of cancer treatments include:\n" +
            "\n" +
            "Surgery\n" +
            "Chemotherapy\n" +
            "Radiation\n" +
            "Bone marrow transplant\n" +
            "Immunotherapy\n" +
            "Hormone therapy\n" +
            "Targeted drug therapy\n" +
            "Clinical trials\n" +
            "Palliative care\n" +
            "Treatment plans are tailored to the type of cancer, how advanced it is, your overall health, and your preferences.\n" +
            "\n"
        ],
        "AIDS (Acquired Immuno Deficiency Syndrome)": [
            "There is no cure for HIV yet. However, antiretroviral treatment (ART) can control HIV and allow people to live a long and healthy life.\n" +
            "\n" +
            "For some people, treatment can reduce the level of HIV in their body to such a low amount that they are unable to pass it on (known as having an undetectable viral load). Having an undetectable viral load can keep you healthy, but it’s not a cure for HIV. To maintain an undetectable viral load a person must keep adhering to their antiretroviral treatment."
        ]
    }

    let x = req.body.myCountry.toString();
    let foundLList = f[x];
    res.render('diet.html', {
        foundLList: foundLList,
        name: name,
        email: email,
        mobileno: mobileno,
        notification: 0,
        filename: "diet.html",
        write: 0

    })

})
app.post('/diets', (req, res) => {
    // var data="mesage from backend"
    let dieseases = req.body.myCountry.toString();
    var f = {
        "Chicken pox": [
            "Avoid foods that may irritate oral lesions, such as spicy, acidic, salty, and crunchy foods.",
            "stays hydrated and nourished while fighting chickenpox.",
            "Consuming foods that are high in iron while fighting chickenpox may help",
            "While vaccines prevent the virus, there are not many treatment options once it has been contracted.",
            "It’s best to avoid foods that are crunchy, hot, spicy, salty, or acidic if you’re experiencing sores on the lips, mouth, or tongue."
        ],
        "Hepatitis": [
            "It’s important to keep your weight in a healthy range, especially if you have hepatitis C. Having obesity or being overweight can lead to hepatic steatosis, a condition caused by excess fat buildup in the liver. This can make hepatitis C harder to control.",
            "People with hepatitis C also have an increased riskTrusted Source for type 2 diabetes, so it’s important to keep an eye on your sugar intake.",
            "You should eat between 1 and 3 cups of vegetables each day. In order to get the widest range of vitamins, vary the types you eat.",
            "Foods containing protein are very important. Protein helps repair and replace liver cells damaged by hepatitis C.",
            "Calories count, so think quantity as well as quality. Eating too much may lead to weight gain or obesity, which can increase your diabetes riskTrusted Source.",
            "Cutting out dishes that are high in sodium is especially important. Salty foods can lead to water retention, consequently raising your blood pressure. This can be dangerous for people with cirrhosis.",

        ],
        "Dengue": [
            "Take foods like\n\t1\tPapaya Leaf\n\t2\tPomogranate\n" +
            "\t3\tCoconut Water\n" +
            "\t4\tTurmeric\n" +
            "\t5\tFenugreek (Methi)\n" +
            "\t6\tOrange\n" +
            "\t7\tBroccoli\n" +
            "\t8\tSpinach\n" +
            "\t9\tKiwi Fruits",
            "Avoid these types of food\n" +
            "\t1\tOily/Fried Food\n" +
            "\t2\tSpicy Food\n" +
            "\t3\tCaffeinated beverages\n" +
            "\t4\tAvoid Non-vegetarian food"

        ],
        "Cholera": [
            "Drinking lots of water effectively helps to get rid of cholera. It is vital for everyone including cholera patients to keep their body hydrated. This is one of the best home remedies that can prevent cholera.",
            "Add some pieces of clove in approximately three litres of water and boil it. Drink this mixture every few hours. This is one of the best home remedies for cholera.",
            "Drinking a mixture of water and basil leaves also effectively helps to cure cholera.",
            "Drink buttermilk; add some rock salt and cumin seeds to it. This is one of the best home remedies for cholera.",
            "The use of lemon for example is very popular in reducing the levels of cholera bacilli in the intestines and digestive system. Lemon juice drunk either sweet or salted can help.",
            "Steep half a nutmeg in half a litre of water and make an infusion. Add to this infusion half a litre of coconut water. Administer this 15ml at a time to lessen cholera symptoms."
        ],
        "Malaria": [
            "Consume foods that provide instant energy such as glucose water, sugarcane juice, fruits juice, coconut water, electoral water, sorbet (sugar, salt and lemon with water), etc.",
            "The requirement of protein is increased as there is a massive tissue loss. A high protein with high carbohydrates diet is helpful in protein utilization for anabolic and tissue building purposes. Intake of high biological value protein such as milk, curd, lassi, buttermilk, fish (stew), chicken (soup/stew), egg, etc are useful to fulfill the requirement.",
            "Fats intake should be in moderation. The uses of dairy fats like butter, cream, fats in milk products, etc are helpful in digestion as they contain medium chain triglycerides (MCT). Excessive use of fat in cooking or eating fry foods aggravate nausea, impaired digestion which leads to diarrhea.",
            "Loss of water and electrolytes is very common in malaria. Food preparation in form of juices, stew, soup, rice water, dal water, coconut water, electoral water, etc are beneficial to maintain it. Vitamin A and Vitamin C rich foods such as carrot, beetroots, papaya, fruits especially citrus fruits (e.g. orange, mausambi, pine apple, grapes, berries, lemon, etc), with vitamin B complex are very useful to boost immunity.\n",
            "Liberal fluid intake is desired to compensate for the fluid losses from the body. A daily fluid intake of 3 to 3.5 liters is recommended.\n",
            "Avoid excess intake of tea, coffee, cocoa and other caffeinated beverages, etc."
        ],
        "Diabetes": [
            "Foods and drinks to limit include\n" +
            "\n" +
            "\tfried foods and other foods high in saturated fat and trans fat\n" +
            "\tfoods high in salt, also called sodium\n" +
            "\tsweets, such as baked goods, candy, and ice cream\n" +
            "\tbeverages with added sugars, such as juice, regular soda, and regular sports or energy drinks",
            "Drink water instead of sweetened beverages. Consider using a sugar substitute in your coffee or tea."

        ],
        "Cancer": [
            "Avoid high-fat, greasy, or spicy foods, or those with strong smells. Eat dry foods like crackers or toast every few hours. Sip clear liquids like broths, sports drinks, and water.",
            "For sores, pain, or trouble swallowing, stick with soft foods. Avoid anything rough or scratchy, and spicy or acidic foods. Eat meals lukewarm (not hot or cold). And use a straw for soups or drinks.",
            "Treatment can have a funny effect on your taste buds. Things you didn't like before might taste good now. So be open to new foods. See if you like sour or tart flavors like ginger or pomegranates. Spices such as rosemary, mint, and oregano might help you enjoy other foods, too.",
            "There’s no diet that can cure cancer. There's also no good research that shows that any eating plan, like a vegetarian diet, for example, can lower the chance of cancer coming back."
        ],
        "AIDS (Acquired Immuno Deficiency Syndrome)": [
            "Do not eat or drink the following foods:\n" +
            "\tRaw eggs or foods that contain raw eggs, for example, homemade cookie dough\n" +
            "\tRaw or undercooked poultry, meat, and seafood\n" +
            "\tUnpasteurized milk or dairy products and fruit juices\n",
            "Follow the four basic steps to food safety: clean, separate, cook, and chill.\n" +
            "\tClean: Wash your hands, cooking utensils, and countertops often when preparing foods.\n" +
            "\tSeparate: Separate foods to prevent the spread of any germs from one food to another. For example, keep raw meat, poultry, seafood, and eggs separate from foods that are ready to eat, including fruits, vegetables, and breads.\n" +
            "\tCook: Use a food thermometer to make sure that foods are cooked to safe temperatures.\n" +
            "\tChill: Refrigerate or freeze meat, poultry, eggs, seafood, or other foods that are likely to spoil within 2 hours of cooking or purchasing."
        ]

    };
    // console.log(dieseases);
    // console.log(f[dieseases][0]);
    let foundLList = f[dieseases];

    res.render('diet.html', {
        foundLList: foundLList,
        name: name,
        email: email,
        mobileno: mobileno,
        notification: 0,
        filename: "diet.html",
        write: 0

    })
})

app.post('/disease', (req, res) => {
    function getMax(arr) {
        if (!arr) {
            return null;
        }
        var minV = arr[0];
        var maxV = arr[0];
        for (a of arr) {
            if (a < minV) minV = a;
            if (a > maxV) maxV = a;
        }
        return maxV;
    }

    // let sym=[
    //     "1",
    //     "2",
    //     "3"
    //     // "4"
    // ];
    let sym = req.body.myCountry.split(" ");
    var myObj = {
        // "a":[
        //     "1",
        //     "2",
        //     "3"
        // ],
        // "b":["2","3"],
        // "c":["1","3","4"]
        "Chicken pox": [
            "fever",
            "Rash",
            "tiredness",
            "loss of appetite",
            "Intense itching"
        ],
        "Hepatitis": [
            "jaundice",
            "loss of appetite",
            "Fatigue",
            "Dark urine",
            "Intense itching"
        ],
        "Dengue": [
            "Nausea",
            "vomiting",
            "Rash",
            "Aches and pains"
        ],
        "Cholera": [
            "vomiting",
            "leg cramps",
            "tiredness",
            "thirst",
            "rapid heart rate"
        ],
        "Malaria": [
            "Nausea",
            "fever",
            "tiredness",
            "jaundice",
            "anemia",
            "diarrhea",

        ],
        "Diabetes": [
            "thirst",
            "tiredness",
            "heal slowly",
            "more infections than usual",
            "dry skin"


        ],
        "Cancer": [
            "Fatigue",
            "fever",
            "heal slowly",
            "anemia",
            "Cough",
            "Pain"
        ],
        "AIDS (Acquired Immuno Deficiency Syndrome)": [
            "Rash",
            "fever",
            "Fatigue",
            "Mouth ulcers",
            "Swollen lymph nodes"
        ]
    };
    var finding = [0, 0, 0, 0, 0, 0, 0, 0];
    let c = 0;
    for (let v in sym) {
        c = 0;
        for (const x in myObj) {
            // text += x + ", ";
            // if (myObj[x].search(v) != null) {
            //     finding[c]++;
            //     c++;
            // }
            // console.log("myObj: " + x);

            for (const i in myObj[x]) {
                if (myObj[x][i] === sym[v]) {
                    finding[c]++;
                }


                // console.log(myObj[x][i] + " " + sym[v]);

            }
            // console.log("c: " + c);

            c++;
        }
    }
    var maxValue = getMax(finding);
    // console.log("max: " + maxValue);
    // console.log(finding);
    c = 0;
    let x;
    for (x in myObj) {
        // x;
        if (finding.indexOf(maxValue) === c) {
            break;
        }
        c++;
    }

    // console.log(x);
    res.render('services.html', {
        disease: x,
        name: name,
        email: email,
        mobileno: mobileno,
        notification: 0,
        filename: "services.html",
        write: 1
    })

})

app.listen(process.env.PORT || 3000, () => {
    console.log("server starts");
})