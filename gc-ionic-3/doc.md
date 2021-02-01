### Documentación ONEapp
___

#### Estructura de proyecto

Esta estructura debe ser respetada a la hora de modificar o agregar módulos, componentes, servicios etc.

```
oneapp
└───node_modules
└───platforms
└───plugins
└───resources
└───src
│   └───app
│   │   └───modules
│   │   │   └───<module> -> (visapp, checkstore, etc)
│   │   │   └───components
│   │   │   │   └───<component>   
│   │   │   │       │    <name>.component.html
│   │   │   │       │    <name>.component.scss
│   │   │   │       │    <name>.component.ts
│   │   │   └───models
│   │   │   │   │   <name>.model.ts
│   │   │   └───<charge> -> (zone, country, store, etc)
│   │   │   │   <module>.<charge>.module.ts -> (visapp.zone.module.ts)
│   │   │   │   <module>.<charge>.page.html -> (visapp.zone.page.html)
│   │   │   │   <module>.<charge>.page.scss -> (visapp.zone.page.scss)
│   │   │   │   <module>.<charge>.page.ts -> (visapp.zone.page.ts)
│   │   │   │   <module>.<charge>.service.ts -> (visapp.zone.service.ts)
│   │   └───shared
│   │   │   └───config
│   │   │   └───helpers
│   │   │   └───pipes
│   │   │   └───services
│   .gitignore
│   angular.json
│   ionic.config.json
│   package.json
│   README.md
```
___

#### Estándares de programación
Para mantener el orden y la claridad del código, respetaremos los siguientes estandares.
* A excepción de las alertas de usuario, todo el resto del código debe estar en inglés (variables, componentes, funciones, etc).
* Los nombres de variables, funciones, componentes, etc. deben ser claros y explicativos por si sólos. ***ambiguo: const a = 20; correcto: const duration = 20;***
* Evitar usar el tipo ***any***. Debemos aprovechar al 100% el tipado que ofrece TypeScript. Por ejemplo, para definir una variable de tipo numérica usaremos ***number*** en vez de ***any***. Para las estrucutras más complejas, definiremos nuestras estructuras usando ***class, interface, type, etc***.
* Cada respuesta que se realice a un servicio, debe ser mapeada a una estructura de dato definida previamente en la aplicación.

```js
    // Evitar
    this.visappService.getVisuals()
        .then((queryResult: any) => {
            this.visuals = queryResult.results;
        });
        
    // Preferir
    this.visappService.getVisuals()
        .then((queryResult: QueryResult) => {
            this.visuals = queryResult.results.map(visual => Visual.jsonToModel(visual));
        })
        .catch((error: Error) => this.errorService.logError(error));
        
    /* En este caso recibimos QueryResult, esto quiere decir que el servicio previamente mapeó la respuesta de la API en una estructura definida en la APP, con esto evitamos errores de interpretación y nos aseguramos de tener respuestas 100% confiables, sin importar si la API falla o cambia su respuesta. */
```
* Cada error producido en la App debe ser enviado al servicio correspondiente para ser registrado, para esto es necesario capturar los distintos errores donde corresponda.
* Documentar el código. Cada componente, función, servicio, etc. debe estar debidamente documentado respetando el formato utilizado por ***compodoc*** para garantizar el correcto funcionamiento de la documentación automática. *Ver: https://medium.com/learnwithrahul/automated-documentation-for-your-typescript-angular-projects-35746aa0ad5e*

___

#### Actualización a través de Ionic Pro.
*Antes de pasar a producción, cada versión debe ser previamente probada por QA en el canal "Development".*
*Antes de subir cualquier actualización, QA debe hacer pruebas regresivas y **UAT debe autorizar la actualización**.*

##### 1 - Crear y subir commit.

- 1.1 En src -> config.ts las variables isBrowser, isTest y testBuild deben estar en **false**.
- 1.2 En src -> shared -> config -> global.ts validar que la configuración sea del cliente y el ambiente sea el deseado.
- 1.3 Asegurarse de que en el json, el atributo **pro** apunte al canal deseado. **Ejm: pro: { appId: '104b3914', channel: 'Development' }**.
- 1.4 git status
- 1.5 git add .  *(si es que hay archivos nuevos)*
- 1.6 git commit -am "<descripción del commit>"
- 1.7 git push ionic <rama de origen>

##### 2 - Crear build.

- 2.2 Ir al dashboard de Ionic  *(https://dashboard.ionicframework.com/apps)*.
- 2.2 Seleccionar la app del cliente.
- 2.3 Ir a commits.
- 2.4 Crear un build del commit subido en el paso anterior  *(No asignar ningún canal, "None")*.
- 2.5 Esperar a que termine satisfactoriamente la compilación. De lo contrario revisar errores, corregir y volver al punto 1.
- *Se puede adelantar el punto 5.2 para compilar en paralelo y ahorrar tiempo.*

##### 3 - Deshabilitar actualizaciones del cliente.

- 3.1 Ir al administrador del cliente (https://<cliente>.<ambiente>.gcapp.cl/admin).
- 3.2 En mantenedores, ir a "Actualizar versión" y **DESMARCAR** el checkbox.

##### 4 - Asignar el build a un canal.

- 4.1 Ir al dashboard de Ionic  *(https://dashboard.ionicframework.com/apps)*.
- 4.2 Seleccionar la app e ir a  "Deploy -> Builds".
- 4.3 Asignar al canal deseado el build compilado en el punto 2.

##### 5 - Probar build localmente.

- 5.1 Ir al proyecto gc-ionic3.
- 5.2 Compilar una aplicación, apuntando al canal deseado con el flag "testBuild" en true. "src -> config.ts -> testBuild: true".
- 5.3 Abrir la aplicación y comprobar que la actualización aparezca y que se instale correctamente.

##### 6 - Propagar o ignorar actualización.

###### 6.1 - El build es correcto.
- 6.1.1 Si el build es correcto, vamos al administrador del cliente (https://<cliente>.<ambiente>.gcapp.cl/admin).
- 6.1.2 En mantenedores, ir a "Actualizar versión" y **MARCAR** el checkbox.
- 6.1.3 Si el ambiente es producción, descargar la App de ambas tiendas "PlayStore y AppStore" y verificar la actualización.

###### 6.2 - El build falla.
- 6.2.1 Si la prueba local arroja un build con white screen u otro error, debemos volver a realizar el flujo desde el punto 1.

*Tiempo estimado: 15 minutos.*

___

#### Canje de códigos B2B

##### 1 - Generar códigos

*Los códigos generados sólo servirán para el país del cliente.*
*Se recomienda realizar este proceso en un navegador Safari actualizado.*

- 1.1 Ingresar a https://business.apple.com/
- 1.2 Inicia sesión con la cuenta del cliente. *Cuenta por defecto de Andain: iosb2b@andain.cl, pwd: Andain5546*.
- 1.3 En el menú ir a **Custom Apps**.
- 1.4 Seleccionar la aplicación deseada.
- 1.5 En **Buy licenses -> License Type**, seleccionar **Redemption Codes**.
- 1.6 En **Quantity**, ingresar la cantidad de códigos deseados (1 código equivale a 1 instalación).
- 1.7 Cuando se generen los códigos, aparecerá la opción "Download" donde podremos descargar los códigos 
(Se recomienda actualizar la página después de unos minutos por si no aparece el botón).

##### 2 - Disponibilizar códigos para un cliente

- 2.1 Entrar a https://<cliente>.<ambiente>.gcapp.cl/admin
- 2.2 En mantenedores ir a **Códigos iOS**, pestaña **Cargar códigos**.
- 2.3 Subir el excel.

##### 3 - Descarga de códigos.

- 3.1 Desde un dispositivo iOS, ingresar a https://<cliente>.<ambiente>.gcapp.cl/front/ios
- 3.2 Iniciar sesión con usuario y contraseña.
- 3.3 Aparecerá una alerta para abrir el AppStore, clickear en Abrir.
- 3.4 Luego darle a canjear.

*Para poder descargar una aplicación a través de este modo, es necesario tener instalada iTunes en el dispositivo.*

*Tiempo estimado: 10 minutos.*

___

#### Compilar y subir aplicación al PlayStore

*Antes de subir cualquier aplicación, QA debe hacer pruebas regresivas y **UAT debe autorizar la subida**.*

##### 1 - Seleccionar el ambiente

- 1.1 En la consola, ir a la raíz del proyecto.
- 1.2 gulp change-env
- 1.3 Ingresar ambiente y cliente.
- 1.4 Ante la pregunta si se quiere relinkear con ionic Pro, responder positivamente: 'y'.
- 1.5 Seleccionar Ionic Pro como método de actualización.
- 1.6 Verificar que el proceso finalice exitosamente.
- 1.7 Si falla la instrucción que crea los recursos, parar el proceso (ctrl+c) y correr el comando: ionic cordova resources.
- 1.8 ionic cordova platform rm android.
- 1.9 ionic cordova platform add android.

##### 2 - Compilar y firmar la aplicación

- 2.1 Verificar que el "id" en el archivo config.xml sea correcto.
- 2.2 Si la subida es una actualización, verificar en "https://play.google.com/apps/publish/<app_a_subi>" que "android-versionCode" y "version" del config.xml, sean mayores a los de la última versión en el PlayStore.
- 2.3 Ir a la ruta del proyecto en la consola.
- 2.4 ionic cordova build android --prod --release.
- 2.5 Esperar a que el proceso finalice satisfactoriamente. Si falla, arreglar errores y volver al punto 2.4.
- 2.6 Buscamos el release, en 'platforms/android/app/build/outputs/apk/release/', copiamos el archivo 'app-release-unsigned.apk' y lo pegamos en la carpeta 'release' que está en la raíz del proyecto.
- 2.7 En la consola, ir a la carpeta 'release'.
- 2.8 jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore visual.keystore -storepass 'andainandain' app-release-unsigned.apk visual
- 2.9 jarsigner -verify -verbose -certs app-release-unsigned.apk
- 2.10 /Users/andain/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 app-release-unsigned.apk <cliente>-<version>.apk

##### 3 - Probar y subir la aplicación

- 3.1 Instalar la app firmada en un dispositivo, probar minimamente la aplicación y pasar a QA.
- 3.2 Una vez QA y UAT aprueben la aplicación, vamos a "https://play.google.com/apps/publish/<app_a_subi>".
- 3.3 Vamos a **Gestión de versiones** -> **Panel de la versión** -> **Gestionar la versión**.
- 3.4 En la tarjeta **Producción**, le damos al botón **Gestionar**.
- 3.5 Luego le damos a **Crear versión**.
- 3.6 Agregamos nuestra APK firmada, completamos el formulario y lanzamos la versión.

*Tiempo estimado: 25 minutos (No se consideran pruebas).*

___

#### Compilar WebRTC para iOS

##### 1 - Descarga WebRTC

- 1.1 Debes tener el comando fetch, si no lo tienes, realiza el punto 2 y luego vuelve al 1.1.
- 1.1 fetch --nohooks webrtc_ios
- 1.2 gclient sync

##### 2 - Instalar DEPOT_TOOLS

*Este paso es necesario solamente si no se tiene el comando fetch.*

- 2.1 git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
- 2.2 export PATH=$PATH:<ruta_donde_clonaste_depottools>

##### 3 - Compilar el framework

- 3.1 cd /ruta_donde_se_hizo_el_fetch/src
- 1.1 gn gen out/ios_64 --args='target_os="ios" target_cpu="arm64" is_component_build=false is_debug=false ios_enable_code_signing=false'
- 1.2 ninja -C out/ios_64 AppRTCMobile


adb -s ce11182be9671c3b03 install -r /Users/andain/Documents/Proyectos/v2/gc-ionic-3/platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb -s R58M65V9BSR install -r /Users/andain/Documents/Proyectos/v2/gc-ionic-3/platforms/android/app/build/outputs/apk/debug/app-debug.apk
adb -s 6NUDU18830012938 install -r /Users/andain/Documents/Proyectos/v2/gc-ionic-3/platforms/android/app/build/outputs/apk/debug/app-debug.apk