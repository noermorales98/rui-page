'use server';

import nodemailer from 'nodemailer';
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

// SMTP Transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function handleFunnelSubmission(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!email) {
    throw new Error('Email is required');
  }

  try {
    const pdfPath = path.join(process.cwd(), 'public', 'Mapa_Expansion_Mental_V2.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Ángeles Terrenales" <no-reply@angelesterrenales.com>',
      to: email,
      subject: '¡Tu Mapa de Expansión Mental ya está aquí! 🚀',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #251857;">
          <h2>¡Hola ${name || 'Buscador'}!</h2>
          <p>Es un honor acompañarte en este inicio de tu camino de expansión.</p>
          <p>Tal como prometimos, aquí tienes tu <strong>Mapa de Expansión Mental</strong>. Este recurso ha sido diseñado para ayudarte a identificar los pilares de tu conciencia que necesitan atención inmediata.</p>
          <p>Lo encontrarás adjunto a este correo.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p>Mientras exploras tu mapa, te invitamos a revisar la oferta exclusiva que tenemos para ti en nuestra página de agradecimiento.</p>
          <p>Con gratitud,<br /><strong>El Equipo de Ángeles Terrenales</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: 'Mapa_Expansion_Mental_V2.pdf',
          content: pdfBuffer,
        },
      ],
    });
  } catch (error) {
    console.error('Error sending email:', error);
    // Even if email fails, we proceed to thanks page as the auto-download will still happen.
  }

  redirect('/thanks?download=true');
}

export async function handleWebinarSubmission(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();

  if (!email) {
    return { error: 'El correo electrónico es obligatorio.' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Rui Machalele" <no-reply@example.com>',
      to: email,
      subject: 'Tu lugar en el webinar está reservado',
      html: `
        <div style="font-family: Georgia, serif; line-height: 1.65; color: #3d3229; max-width: 560px;">
          <h2 style="color: #2a231c; font-weight: normal;">Hola ${name || 'allí'},</h2>
          <p>Gracias por reservar tu lugar. En breve recibirás los detalles de conexión al webinar del <strong>Método de los 4 Ángeles</strong>.</p>
          ${phone ? `<p>Te contactaremos también al <strong>${phone}</strong> si es necesario.</p>` : ''}
          <p>Si no ves el correo, revisa promociones o spam.</p>
          <p style="margin-top: 28px;">Con intención,<br /><strong>Rui Machalele</strong></p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending webinar confirmation:', error);
  }

  redirect('/webinar/gracias');
}
