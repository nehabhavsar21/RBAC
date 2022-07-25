/****************************
 EMAIL HANDLING OPERATIONS
 ****************************/
let nodemailer = require('nodemailer');
const Mustache = require('mustache');

const config = require("../../configs/configs");

let smtpTransport = nodemailer.createTransport({
    pool: true,
    host: config.emailhost,
    port: 587,
    secure: false, // use TLS,
    auth: {
        user: config.user,
        pass: config.pass
    },
    debug: true
});

class Email {

    send(mailOption) {
        return new Promise(async (resolve, reject) => {
            smtpTransport.sendMail(mailOption, (err, result) => {
                if (err) {
                    console.log("er =", err);
                    return reject({ sattus: 0, message: err });
                }
                return resolve(result);
            });
        });
    }

    sendMail(mailData) {
        return new Promise(async (resolve, reject) => {
            try {
                let emailTemplate = await EmailTemplate.findOne({ emailKey: mailData['emailKey'] });
                if (emailTemplate) {
                    await DefaultSettings.findOne().select({ defaultFromEmail: 1, defaultAdminEmail: 1 });
                    await EmailSettings.findOne({ emailTemplateId: emailTemplate._id });
                    let mailOptions = {
                        from: config.defaultEmailId,
                        to: mailData.emailId ? mailData.emailId : [],
                        subject: emailTemplate.subject ? emailTemplate.subject : "Subject",
                        html: Mustache.render(emailTemplate.emailContent, mailData.replaceDataObj)
                    }
                    const result = await new Email().send(mailOptions);
                    console.log('result', JSON.stringify(result))
                    return resolve(result);
                } else {
                    return resolve({ status: 0, message: "Template not found." })
                }
            } catch (error) {
                console.log('error', error)
                return reject(error);
            }
        });
    }

    verifySmtp() {
        // verify connection configuration
        smtpTransport.verify(function (error, success) {
            if (error) {
                console.log(error);
            } else {
                console.log('Server is ready to take our messages');
            }
        });

    }
}

module.exports = Email;