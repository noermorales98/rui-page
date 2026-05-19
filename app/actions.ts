'use server';

import nodemailer from 'nodemailer';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

/** Webinar público «El método de los 4 ángeles» — registros desde /webinar */
const WEBINAR_PUBLIC_ID = parseInt(process.env.WEBINAR_PUBLIC_ID ?? '1');

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

  const normalizedEmail = email.toLowerCase();
  const phoneTrimmed = phone ? phone : '';
  const nameTrimmed = name?.trim() ?? '';
  const displayName =
    nameTrimmed ||
    (normalizedEmail.includes('@') ? normalizedEmail.split('@')[0] : normalizedEmail) ||
    'Participante';

  try {
    const webinarExists = await prisma.webinar.findUnique({
      where: { id: WEBINAR_PUBLIC_ID },
      select: { id: true, title: true },
    });
    if (!webinarExists) {
      return {
        error:
          'No se pudo completar el registro (webinar no configurado). Contacta al equipo.',
      };
    }

    await prisma.$transaction(async (tx) => {
      const existingContact = await tx.contact.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, phone: true },
      });

      let contactId: number;

      if (existingContact) {
        const updateData: { name?: string; phone?: string } = {};
        if (!existingContact.name?.trim() && nameTrimmed) {
          updateData.name = nameTrimmed;
        }
        if (phoneTrimmed && !existingContact.phone?.trim()) {
          updateData.phone = phoneTrimmed;
        }
        if (Object.keys(updateData).length > 0) {
          await tx.contact.update({
            where: { id: existingContact.id },
            data: updateData,
          });
        }
        contactId = existingContact.id;
      } else {
        const created = await tx.contact.create({
          data: {
            name: displayName,
            email: normalizedEmail,
            phone: phoneTrimmed || null,
            source: 'WEBINAR',
          },
          select: { id: true },
        });
        contactId = created.id;
      }

      const now = new Date()

      const existingReg = await tx.webinarRegistration.findUnique({
        where: {
          webinarId_contactId: {
            webinarId: WEBINAR_PUBLIC_ID,
            contactId,
          },
        },
        select: { id: true, registrationDates: true },
      })

      if (!existingReg) {
        await tx.webinarRegistration.create({
          data: {
            webinarId: WEBINAR_PUBLIC_ID,
            contactId,
            status: 'REGISTERED',
            registrationCount: 1,
            registrationDates: [now.toISOString()],
          },
        })
      } else {
        const prevDates = Array.isArray(existingReg.registrationDates)
          ? (existingReg.registrationDates as string[])
          : []
        await tx.webinarRegistration.update({
          where: {
            webinarId_contactId: {
              webinarId: WEBINAR_PUBLIC_ID,
              contactId,
            },
          },
          data: {
            registrationCount: { increment: 1 },
            registrationDates: [...prevDates, now.toISOString()],
          },
        })
      }

      await tx.contactActivity.create({
        data: {
          contactId,
          type: 'WEBINAR_REGISTERED',
          body: `Registro en el webinar «${webinarExists.title}».`,
        },
      })
    });

    revalidatePath('/crm/contactos');
    revalidatePath('/crm/webinars');
    revalidatePath(`/crm/webinars/${WEBINAR_PUBLIC_ID}`);
  } catch (e) {
    console.error('Error guardando registro de webinar en CRM:', e);
    return {
      error: 'No se pudo guardar tu registro. Intenta de nuevo en unos minutos.',
    };
  }

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const safeName = name ? esc(name) : 'allí';
  const safePhone = phone ? esc(phone) : '';

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Rui Machalele" <no-reply@example.com>',
      to: email,
      subject: 'Tu lugar en el webinar está reservado',
      html: `
        <div style="font-family: Georgia, serif; line-height: 1.65; color: #3d3229; max-width: 560px;">
          <h2 style="color: #2a231c; font-weight: normal;">Hola ${safeName},</h2>
          <p>Gracias por reservar tu lugar. En breve recibirás los detalles de conexión al webinar del <strong>Método de los 4 Ángeles</strong>.</p>
          ${safePhone ? `<p>Te contactaremos también al <strong>${safePhone}</strong> si es necesario.</p>` : ''}
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
