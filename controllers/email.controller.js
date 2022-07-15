import { dataEnv } from '../config/env.config.js';
import sgMail from '@sendgrid/mail' 

sgMail.setApiKey( dataEnv.parsed.SENDGRID_API_KEY)

function email(req, res) {
    const {to, subject, text, html} = req.body
    const msg = {
        to,
        from: '211099@ids.upchiapas.edu.mx',
        subject,
        text,
        html
    }

    try {
         sgMail.send(msg)
    } catch (err) {
        return res.status(err.code).send(err.message)
    }
}


export const emailController = {email}
