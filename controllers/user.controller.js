
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getUser } from '../models/user.model.js';
import { dataEnv } from '../config/env.config.js';
import { v4 as uuidv4 } from 'uuid';
import { response } from 'express';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const data = dotenv.config({
    path: path.resolve(__dirname, `../environments/.env.${process.env.NODE_ENV}`)
})

const user_create = (req, res) => {
    getUser.User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password

    }, { fields: ['name', 'email', 'password'] })
        .then(users => {
            res.send(users)
        })
        .catch(err => {
            res.status(400).send(err)
        });
};


const user_login = async (req, res) => {
    const user = await getUser.User.findOne({ where: { email: req.body.email } });

    if (user) {
        const validPassword = bcryptjs.compare(req.body.password, user.password);
        if (validPassword) {
            const token = jwt.sign({
                sub: user.name,
                id: user.id,
            }, 'secret', { expiresIn: '30m' }, data.parsed.JWT_TOKEN_SECRET, { algorithm: 'HS256' })

            user.token = token;

            res.header('auth-token', token).json({
                error: null,
                data: {
                    token,
                    user: user.id
                }
            });
        } else {
            if (!validPassword) return res.status(400).json({ error: 'contraseña no válida' })
        }
    } else {
        return res.status(400).json({ error: 'Usuario no encontrado' });
    }
};
const recovery_password = (req, res) => {
    sgMail.setApiKey(dataEnv.parsed.SENDGRID_API_KEY)
    const token = uuidv4();
    const email = req.body.email;
    const msg = {
        to: req.body.email,
        from: '211099@ids.upchiapas.edu.mx', //verificar tu email
        subject: "Recuperar contraeña",
        text: "Recuperar Contraseña",
        html: `<ul><li><a href=http://localhost:3000/${token}> Website</a></li></ul>`,
    }
    sgMail
        .send(msg)
        .then((response) => {
            if (response[0].statusCode === 202) {
                getUser.UserRecovery.create({
                    email,
                    token,
                }, { fields: ['email', 'token'] })
                    .then(data => {
                        res.send(data)
                    })
                    .catch(err => {
                        res.status(400).send(err)
                    });
                //insertar en la tabla de email y token generado
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

const user_update = (req, res) => {

    let email = req.body.email;
    let newDatas = req.body;

    getUser.User.findOne({ where: { email: email } })
        .then((r) => {
            r.update(newDatas)

        })
        .catch((err) => {
            res.status(400).send(err)
        });
}

//user.password = user.password && user.password != "" ? bcryptjs.hashSync(user.password, 10) : "";


export const userController = { user_create, user_login, user_update, recovery_password };