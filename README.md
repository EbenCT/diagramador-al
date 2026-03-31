

# Diagramador AL

**Diagramador AL** es una plataforma integral para la creación, edición y automatización de diagramas UML, con colaboración en tiempo real y generación automática de código para backend y frontend. Incorpora un asistente de Inteligencia Artificial (IA) que optimiza y automatiza procesos repetitivos, recomendando mejoras y generando artefactos de software listos para usar.

## Funcionalidades principales

- Edición visual y colaborativa de diagramas UML (clases, relaciones, etc.)
- Colaboración multiusuario en tiempo real con gestión de sesiones
- Control de acceso, roles y permisos de usuario
- Guardado automático, historial de cambios y notificaciones de eventos
- Asistente IA integrado para:
  - Sugerencias inteligentes y validación de diagramas
  - Automatización de tareas repetitivas y generación de artefactos
  - Recomendaciones de buenas prácticas y detección de inconsistencias
- Generación automática de código a partir de diagramas:
  - **Backend en Java Spring Boot**: entidades, servicios, controladores, seguridad (Spring Security)
  - **Frontend en Flutter**: modelos, servicios API, providers de estado, pantallas de UI
  - **Migraciones SQL** y archivos de prueba para Postman
- Exportación e importación de diagramas en formatos estándar (XMI, imagen, etc.)
- Interfaz moderna, responsiva y personalizable
- Integración con Docker y soporte para despliegue automatizado

## ¿Para qué sirve?

Diagramador AL está orientado a equipos de desarrollo, arquitectos de software, docentes y estudiantes que buscan acelerar el diseño, documentación y prototipado de sistemas, automatizando la generación de código y facilitando la colaboración remota.

## Tecnologías principales

- **Laravel** (backend principal, API y lógica de negocio)
- **Livewire** (componentes interactivos y reactividad)
- **Java Spring Boot** (generación automática de backend)
- **Flutter** (generación automática de frontend)
- **Tailwind CSS** (estilos)
- **JavaScript** (editor visual, IA y automatización)

## Instalación rápida

1. Clona el repositorio y entra en la carpeta del proyecto.
2. Instala dependencias PHP y JavaScript:
	- `composer install`
	- `npm install && npm run build`
3. Configura el archivo `.env` y la base de datos.
4. Ejecuta migraciones:
	- `php artisan migrate`
5. Inicia el servidor:
	- `php artisan serve`

## Licencia

Este proyecto está bajo licencia MIT.
