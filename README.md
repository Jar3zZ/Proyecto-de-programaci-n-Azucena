# Portal de Evidencias

Página web adaptable a celular basada en el mockup original: bienvenida y perfil, accesos por categorías y galería/listado de evidencias. Se mejoró con navegación funcional, resumen de registros, formularios, diseño adaptable y almacenamiento local.

## Archivos
- `index.html`: estructura de la aplicación.
- `css/estilos.css`: diseño visual y adaptación a celular.
- `js/app.js`: navegación, perfil y gestión de evidencias.

## Probar en tu computadora
Abre `index.html` en un navegador. Para una prueba local también puedes usar la extensión Live Server de Visual Studio Code.

## Publicar gratis con GitHub Pages
1. Crea un repositorio nuevo en GitHub, por ejemplo `portal-de-evidencias`.
2. Sube `index.html` y las carpetas `css` y `js` (puedes subir todo el contenido del ZIP).
3. En el repositorio entra a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Elige la rama `main` y la carpeta `/ (root)`, guarda.
6. Espera a que GitHub genere el enlace. Normalmente tendrá la forma `https://TU-USUARIO.github.io/portal-de-evidencias/`.

## Importante sobre los datos
Esta es una primera versión estática. Los registros, perfil y archivos adjuntos se guardan en el almacenamiento local del navegador/dispositivo, no en una base de datos central. Por eso no se sincronizan automáticamente entre celular y computadora; si borras los datos del navegador, puedes perderlos. GitHub Pages publica los archivos del sitio, pero no procesa C# ni ofrece una base de datos.
No subas información sensible ni identificaciones personales a un repositorio público. Para sincronización real entre dispositivos se necesita agregar un servicio de autenticación y base de datos.
