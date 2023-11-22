//this file is sending email to reset forgot password 

const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email{
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Vinit Sharma <${process.env.EMAIL_FROM}>`;
    }

    //class method
    newTransport() {
        if(process.env.NODE_ENV === 'production') {
            //sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {               
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }                     
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            //it is for user authentication(login) values are in config.env file  
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            } 
        });
    }

    //class method: sending pug template and subject. sending the actual email
    async send(template, subject){
        //1) Render HTML based on a pug template
        const html = pug.renderFile(
            `${__dirname}/../views/email/${template}.pug`, 
            {
            firstName: this.firstName,
            url: this.url,
            subject
        }) 

        //2) define email options
        const mailOptions = {
            from: this.from,  //where the mail coming from
            to: this.to,  //recepient 
            subject, //subject of email
            html,
            text: htmlToText.fromString(html)  // format of email. now it is text but can be html
        };
        
        //3)crerate a transport and send email 
        await this.newTransport().sendMail(mailOptions);
    }
 
    //class method: sending the send method
    async sendWelcom(){
        await this.send('welcome', 'Welcome to the Natours Faimly'); 
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'yourPassword rest token (valid for only 10 minutes)'
        );
    }
};

