const nodemailer = require("nodemailer");

async function test() {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "tejwanisahil73@gmail.com",
            pass: "xbsrecyvqrdxinne",
        },
    });

    const info = await transporter.sendMail({
        from: "tejwanisahil73@gmail.com",
        to: "tejwanisahil866@gmail.com",
        subject: "Test",
        text: "Hello",
    });

    console.log(info);
}

test().catch(console.error);