# VotoSmart Colombia 🏢🗳️

Sistema integral para la gestión de asambleas generales (ordinarias y extraordinarias), control de quórum en tiempo real y votaciones digitales ponderadas por coeficientes para conjuntos residenciales y edificios de Propiedad Horizontal en Colombia (Ley 675 de 2001).

---

## 🚀 Características Principales

- **Quórum en Tiempo Real:** Cálculo automático del porcentaje de asistencia ponderado por coeficientes nominales.
- **Votaciones Digitales Seguras:** Votaciones secretas o nominales con ponderación automática de votos y gráficos de resultados al instante.
- **Acceso Seguro en Dos Pasos (OTP):** Validación de identidad de copropietarios con cédula y código de un solo uso despachado al correo registrado.
- **Roles y Permisos Segregados:** 
  - Administrador de la Copropiedad
  - Mesa Directiva: Presidente, Secretaria, Contador y Revisor Fiscal
  - Copropietario / Apoderado
- **Múltiples Copropiedades:** Soporte para administrar y alternar entre distintos conjuntos residenciales.
- **Generación Automática de Actas:** Exportación y compilación legal de deliberaciones, quórum de inicio y cierre, y decisiones adoptadas.
- **Centro de Auditoría y Correos:** Historial y trazabilidad de todos los correos electrónicos y códigos de seguridad emitidos.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Backend:** Node.js, Express, TypeScript.
- **Notificaciones:** Nodemailer con soporte para servidor SMTP e historial seguro.
- **Reportes:** jsPDF, XLSX para censos y actas oficiales.

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (versión 18 o superior)
- npm o bun

### Pasos

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   cd TU-REPOSITORIO
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el entorno de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```

5. Iniciar en producción:
   ```bash
   npm start
   ```

---

## 📧 Configuración de Envío de Correos (100% Gratis)

Para que los códigos de acceso (OTP), convocatorias y certificados se envíen a los correos reales de los copropietarios sin costo, configura en tu archivo `.env` una de las siguientes opciones:

### Opción 1: Gmail (Gratis - Hasta 500 correos diarios)
1. Ingresa a la seguridad de tu cuenta de Google: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Activa la **Verificación en dos pasos**.
3. En la barra de búsqueda de Google Account escribe: **"Contraseñas de aplicaciones"** (o *App Passwords*).
4. Crea una contraseña con el nombre `VotoSmart` y copia el código de 16 letras generado (ejemplo: `abcd efgh ijkl mnop`).
5. Agrega a tu archivo `.env`:
   ```env
   GMAIL_USER=tu_correo@gmail.com
   GMAIL_PASS=abcdefghijklmnop
   EMAIL_FROM="VotoSmart <tu_correo@gmail.com>"
   ```

### Opción 2: Brevo / Sendinblue (Gratis - 300 correos diarios para siempre)
1. Regístrate gratis en [brevo.com](https://www.brevo.com) (no requiere tarjeta de crédito).
2. Ve a **Configuración** > **SMTP & API** y copia tus credenciales.
3. Agrega a tu archivo `.env`:
   ```env
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_USERNAME=tu_correo_smtp_brevo
   EMAIL_PASSWORD=tu_clave_smtp_brevo
   EMAIL_FROM="VotoSmart <tu_correo_verificado@tudominio.com>"
   ```

---

## ⚖️ Marco Legal

Desarrollado en cumplimiento con la normativa colombiana de Propiedad Horizontal:
- **Ley 675 de 2001** (Régimen de Propiedad Horizontal).
- Quórum deliberatorio (art. 45) y mayorías calificadas del 70% (art. 46).
- Requisitos formales y plazos de elaboración del acta (art. 47).
