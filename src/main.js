//TWITTER
//INSTAGRAM

const dotenv = require("dotenv");
const { Client } = require("@notionhq/client");
dotenv.config();
const nodemailer = require("nodemailer");

const { initializeApp } = require("firebase/app");
const { collection, addDoc, getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_APIKEY,
  authDomain: "daily-quote-68eba.firebaseapp.com",
  projectId: "daily-quote-68eba",
  storageBucket: "daily-quote-68eba.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
  appId: "1:231965515430:web:98c33be2137e8e6a891e67",
  measurementId: "G-0VE9XR7L7L",
};

const app = initializeApp(firebaseConfig);

(async function quoteApp() {
  console.log("Getting quote...");

  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  const databaseId = process.env.NOTION_DATABASE_ID;

  const dbResponse = await notion.databases.query({
    database_id: databaseId,
  });

  const results = dbResponse.results;
  const { id } = results[Math.floor(Math.random() * results.length)];

  const quoteResponse = await notion.pages.retrieve({
    page_id: id,
  });

  const quote = quoteResponse.properties.Quote.title[0].plain_text;
  const url = quoteResponse.url;
  //   console.log(quoteResponse);

  console.log("Copying to Firebase...");

  const db = getFirestore(app);

  await addDoc(collection(db, "quotes"), {
    quote: quote,
  });

  console.log("Sending Email...");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.AUTH_USER, // generated ethereal user
      pass: process.env.AUTH_TOKEN, // generated ethereal password
    },
  });

  // send mail with defined transport object
  await transporter.sendMail({
    from: "Jonathan's Quotes" + process.env.MAIL_FROM,
    bcc: process.env.MAIL_BCC,
    subject: "Today's Quote",
    html:
      `<h1>` +
      quote +
      `</h1>` +
      `<p style="font-size: 24px>Se rispondi a questa mail mi arriva il tuo messaggio! Fammi sapere in che modo ha influenzato la tua giornata.</p>
      <a href="` +
      url +
      `">
      <p style="font-size: 16px">Original quote on Notion</p></a>
    <a href=
    "https://github.com/jonathan-rgb/jonathan-s-quotes"
    ><p style="font-size: 8px">Github repository</p></a>`,
  });

  console.log("Email sent!");

  return {
    props: { quote },
  };
})();
