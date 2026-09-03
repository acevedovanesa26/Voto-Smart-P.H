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

## ⚖️ Marco Legal

Desarrollado en cumplimiento con la normativa colombiana de Propiedad Horizontal:
- **Ley 675 de 2001** (Régimen de Propiedad Horizontal).
- Quórum deliberatorio (art. 45) y mayorías calificadas del 70% (art. 46).
- Requisitos formales y plazos de elaboración del acta (art. 47).
