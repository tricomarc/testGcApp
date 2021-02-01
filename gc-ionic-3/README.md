# How to start
First, you need to install a few things.

## For Windows:
1. Install NVM -> See documentation here: https://github.com/coreybutler/nvm-windows <br />
	- nvm install 7.0.0 <br />
	- nvm list <br />
	- nvm use (version) -> example: nvm use 7.0.0 (You should see this version in the nvm list command) <br />
	- nvm -v (if you see the node version, you have finished this part ) <br />
2. Install Ionic <br />
	- npm install -g ionic@2.1.4 <br />
	- ionic info ( You should see the info of ionic ) <br />
3. Install Cordova <br />
	- npm install -g cordova <br />
4. Install Git
	- https://git-scm.com/download/win or https://www.sourcetreeapp.com/
5. Clone the project: <br />
	- git clone http://git.andain.cl/gc/app.git <br />
6. Install npm dependencies <br />
	- npm i <br />
7. Setup the environment <br />
	- gulp config --env dv --project default ( This is the default environment, if you want more information about this, see below at the "Changing environment" section ) <br />
8. Run the Ionic application <br />
	- ionic serve <br />

## For Linux: <br />
1. Install NVM -> See documentation here: https://github.com/creationix/nvm <br />
	- nvm install 7.0.0 <br />
	- nvm list <br />
	- nvm use (version) ->  example: nvm use 7.0.0 (You should see this version in the nvm list command) <br />
	- nvm -v ( if you see the node version, you have finished this part ) <br />
2. Install Ionic <br />
	- npm install -g ionic@2.1.4 <br />
	- ionic info ( You should see the info of ionic ) <br />
3. Install Cordova <br />
	- npm install -g cordova <br />
4. Clone the project: <br />
	- git clone http://git.andain.cl/gc/app.git <br />
5. Install npm dependencies <br />
	- npm i <br />
6. Setup the environment <br />
	- gulp config --env dv --project default (This is the default environment, if you want more information about this, see below at the "Changing environment" section ) <br />
7. Run the Ionic application <br />
	- ionic serve <br />

# Changing environment ( www/js/config/env ) <br />

## Projects: <br />
- default <br />
- abcdin <br />
- corona <br />
- cruzverde <br />
- dijon <br />
- olimpica <br />

## Environmetns: <br />
- dv: Development <br />
- pr: Production <br />
- qa: Quality Assurance <br />
- st: Staging <br />
- local: Local env <br />

How to use it (Example): <br />
gulp config --project default --env dv <br />
Or if you want to choose the env with sass, you could do this: gulp env --project default --env dv <br />

You can also do this: ionic serve. This should show you all the options that you can choose. <br />

This task should create a config.js file in "www/config". This file contains an angular module config file and it is injected in the app.js located at "www/js". <br />

# Pasos para configurar las notificaciones push por cliente


## Android Onesignal
1. Ingresar a https://onesignal.com/
1.1. Ingresar como Cuenta Google: android@andain.cl @ Andain5546
2. Crear nuevo app.
2.1 Colocar el nombre del cliente y crear app.
3. Llenar formulario inicial.
3.1 Seleccionar plataforma Android.
3.2 Google Android (GCM) Configuration. Ingresar a https://console.firebase.google.com/?hl=es con las mismas credenciales que el paso 1.1.
3.2.1 Crear Proyecto o consultar proyecto de Firebase.
3.2.2 Ir a la configuración del proyecto (Tuerca del menu arriba a la izquierda). "Configuración del Proyecto".
3.2.3 Ir a la pestaña de "Mensajería en la Nube". Y copiar "Clave de servicor" -> "Token". Esto viene siendo en OneSignal el "Google Server API Key".
3.2.3 Ir a la pestaña de "Mensajería en la Nube". Y copiar "ID del remitente" -> "Token". Esto viene siendo en OneSignal el "Google Project Number".
3.3 Seleccionar el SDK: "Phonagap, Cordova, Ionic, Intel XDK".
3.4 Install SDK -> Copiar el APP ID.
3.5 Ir al archivo de configuración del cliente gc-app/www/config/env/[cliente]/st.json
3.5.1 Sustituir el parametro app_id con el valor copiado en el paso 3.4
3.6 Compilar la aplicación en el movil y hacer la prueba de envio de notificaón desde el servicio de onesignal (Check Subscribed Users).
```
Header: Content-Type -> application/json
Method: POST
Body -> raw en POSTMAN
{
	"app_id": "368974af-cbfb-4b25-87e2-c030110e4654",
	"include_player_ids": ["15404ffb-ce29-4286-86ae-0200cec2b44c"],
	"small_icon": "icon",
	"large_icon": "icon",
	"contents": {
		"en": "Tituloooo"
	},
	"data": {
		"message": "Mensaje"
	}

}

app_id: El id de la aplicacio9n de OneSignal
include_player_ids: Tokens de usuarios que se generan cuando se usa la aplicación.
```

## Android
1. Ir a https://firebase.google.com, y hacer login con android@andain.cl
2. Arriba a la derecha hacer click en "ir a la consola"
3. Seleccionar el proyecto (Este ejemplo se hara con Dijon)
4. Luego buscar "Settings", debe estar en la tuerca que esta arriba en el menu de la izquierda y hacer click en configuración de proyectos.
5. Luego ir a la opción de "Mensajería en la nube"
6. En esta sección se van a ver dos cosas importantes, la primera es la "Clave de servidor" y la segunda es el "Id del remitente". (Deja estos dos parámetros a la mano que luego se van a usar).
7. Ir a https://apps.ionic.io/ y hacer login con ionic@andain.cl @ andain5546
8. Selecciona el proyecto (En este ejemplo seguiremos con Dijon)
9. Dentro del proyecto, debajo del nombre hay un ID. (Deja este parametro a la mano que luego lo vamos a usar)
10. Ir a Settings -> API Keys.
10.1. En esta sección es donde se listan y se crean los tokens que vamos a usar en la aplicación (Por ahora ten a la mano el token de producción que ahora lo vamos a utilizar).
	- Si vas a crear un token, haz click en "New Token"
		- Ponle un nombre, ejemplo "Development" y dale al boton de Create.
11. Ir a Settings -> Certificates
	- En esta sección es donde se listan y crean los certificados. (En el listado, deja a la mano el tag del primer certificado que se va a listar)
		- Si vas a crear un certificado, haz click en "New Security Profile"
			- Colocale un "Profile Name", puede ser el que quieras, solo debes guardar el tag que se genera para usarlo luego. Y selecciona un "Type". Es recomendable que si vas a hacer pruebas, hacerlo como tipo Development por que hay un limite de notificaciones. Y por último hacer click en "Create".

*En este punto tenemos ya todos los parámetros que necesitamos para configurar nuestra aplicación. Ahora vamos a agregar los parametros dentro de nuestro proyecto en Ionic.*

1. Suponiendo que estamos en la carpeta del proyecto, ir a www -> js -> app.js
2. Al final del archivo debe haber un app.config de ionic como este ejemplo:

```javascript
app.config(function($ionicCloudProvider) {
	var push = $ionicCloudProvider.init({
		"core": {
			"app_id": "f802c990"
		},
		"push": {
			"sender_id": "1093530856432",
			"pluginConfig": {
				"ios": {
					"badge": true,
					"sound": true
				},
				"android": {
					"iconColor": "#343434"
				}
			}
		}
	});
});
```

	- El parámetro "core.app_id" es el id de nuestro proyecto en ionic (Paso 9 de la sección Android)
	- El parámetro "push.sender_id" es el id del remitente de Firebase (Paso 6 de la sección Android)

*Ahora ya tenemos nuestra aplicación configurada con los push notifications.*

*Para probar que esta funcionando haz lo siguiente:*

1. Con PostMan crea una petición de tipo POST a este url: https://api.ionic.io/push/notifications
2. Como Headers usa:
	Content-Type: application/json
	Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMzI3NzYyMC03OTY2LTQ5YWUtYWJlMC05MTM4ZjNmZWVlNTQifQ.OnUXDY-ss9Cto8GxtHeB1Zz8r13AsdS6gx-XIDESTz8
	(Toma en cuenta que el Authorization puede variar, y ese token lo conseguimos en el paso 10.1 de la sección Android)
3. Por último en el Body agrega un raw con lo siguiente:

```
{
	"tokens": ["fC4vTRBkUjA:APA91bGtm4IkQIZKT4Lio1o_gEYJD7dl8AiE5Sf5ud4VMqFtb5hlWYxK7QjiFtwHpd_xu-l2EZ-m0JDQNYxubFYMUdCnguHSVI0oJ3KzYbzCmGXWBj1Yon-mq_xKtOHryKJZerfcTOYx"],
	"profile": "android_push_notifications",
	"notification": {
		"message": "Hello World!",
		"ios": {
			"message": "Hello iOS!"
		},
		"android": {
			"message": "Hello Android"
		}
	}
}
```

	- El parámetro "tokens", es un arreglo de tokens, estos tokens se generan por dispositivo, es decir, para poder obtener este token debemos instalar la aplicación en un teléfono y en la consola debería salir un mensaje que dice: "Ionic Push: saved push token", ese es el token que va dentro del arreglo, igual puede agregar n tokens para probar si llegan en varios dispositivos a la vez.
	- El parámetro "profile", es el tag de los certificados de ionic (ver paso 11.1 de la sección Android)

*Por último para terminar de configurar las notificaciones tienes que hacer lo siguiente:*

1. Copiar el Token de la consola de Firebase "Clave de servidor" (ver paso 6 de la sección de Android).
2. Luego en administrador de Ionic -> Settings -> Certificates. Editar el tag que creaste, pasar a la pestaña de Android y pegarlo en el "FCM Server ID" y guardar.

*Ahora al momento de hacer el "Send" en PostMan, debería enviar la notificación al dispositivo que agrego.*

*Ahora, para configurar las notificaciones con el admin, debe hacer lo siguiente:*

1. Suponiendo que estas dentro de la carpeta del proyecto ir a: Config -> core.php.
2. En el archivo buscar lo siguiente:

```
Configure::write('ionic.apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2RkZWY4NC01OGUzLTQ2NjMtYTk4OS1jZDM0ODkwMmJiZmEifQ.pVEmlyiZyAC8MPTU1cjGwN83lyAva2AciNRbPhPp5n8');
Configure::write('ionic.appId', 'f802c990');
```

	- En el parámetro "ionic.apikey" va el api key de Ionic (ver el paso 10.1 de la sección Android)
	- En el parámetro "ionic.appId" va el id del app de Ionic (ver el paso 9 de la sección Android)

## iOS
1. Ir a https://developer.apple.com/account/, y hacer login con appios@andain.cl <br />
2. En el menú a la izquierda, seleccionar "Certificados, IDs & Perfiles" <br />
3. Seleccionar la pestaña APP ID, si el ID de la APP no se encuentra registrado, registrarlo (por lo general se guardan en reversed DNS, EJ: cl.andain.www) <br />


4. Abrimos Keychain Access en MAC OSX (Buscar en Finder -> Applications -> Keychain Access) <br />
5. Hacemos click en la parte superior en la opción Keychain Access -> Certificate Assistant -> Request a Certificate From a Certificate Authority <br />
6. Aca llenamos el campo User Email Address y Common Name, seleccionamos Saved to Disk y hacemos click en continuar. (Debemos tener a la mano el archivo `.certSigningRequest` que se genera) <br />
7. Ahora nos vamos a la pestaña Certicates -> Development en el Apple Developer Center <br />
8. Seleccionamos agregar nuevo (simbolo de `+` en la parte superior) y seguimos los pasos (elegimos la opción iOS App Development ya que estamos en el ambiente de desarrollo) <br />
9. Luego subimos el archivo `.certSigningRequest` que creamos anteriormente. El Developer Center lo procesara y generara un certificado que debemos descargar (Este nuevo certificado debe ser un `.cer`) <br />
10. Una vez descargado el certificado `.cer`, debemos convertirlo a `.p12`. <br />
	10.1. Arrastramos el archivo `.cer` al Keychain Access. <br />
	10.2. Una vez se agregue al listado, hacemos click derecho sobre el certificado y seleccionamos la opción `Export "iPhone Developer: ..."` <br />
	10.3. Seleccionamos `Personal Information Exchange (.p12)` como tipo de archivo y lo guardamos. Nos pedira ingresar una contraseña (Debemos tener a la mano el archivo `.p12` y la contraseña que guardamos) <br />
11. Ahora debemos generar un Provisioning Profile.  <br />
	11.1. Volvemos al Apple Developer Center a la pestaña Certificates, IDs & Profiles -> Provisioning Profiles -> Development <br />
	11.2. Seleccionamos la opción iOS App Development, el APP ID de la aplicación (que generamos en el paso 3), el certificado (que generamos en el paso 9) y los dispositivos que queramos usar para pruebas en el ambiente de development <br />
	11.3. Al finalizar se generará un archivo `.mobileprovision` (este es nuestro provisioning file) el cual debemos descargar <br />
12. Ahora debemos configurar las credenciales en el Ionic Dashboard:  <br />
	12.1. Vamos a https://apps.ionic.io/ y hacemos login con ionic@andain.cl  <br />
	12.2. Seleccionamos el proyecto o APP con la cual estamos trabajando <br />
	12.3. Vamos a la pestaña Settings -> Credentials y buscamos el perfil con el cual estamos trabajando <br />
	12.4. En la pestaña iOS -> Build Credentials: <br />
		12.4.1. Subimos el archivo `.p12` (que generamos en el paso 10.3) y ponemos la contraseña <br />
		12.4.1. Subimos el archivo `.mobileprovision` (que generamos en el paso 11.3) <br />
		12.4.2. Hacemos click en Save <br />
13. Nos vamos al Apple Developer Center Certificates, IDs & Profiles -> App IDs y buscamos en la lista el APP ID que generamos anteriormente <br />
14. Hacemos click en Edit, chequeamos que la opción Push Notifications este seleccionada y de no estarlo activarla. <br />
15. En la opción Development SSL Certificate hacemos click en Create Certificate <br />
	15.1. Repetimos los pasos del 4 al 6 <br />
	15.2. Luego repetimos los pasos 9 y 10 (completo) <br />
16. Volvemos al Dashboard de Ionic y seleccionamos Settings -> Credentials y buscamos el perfil con el cual estamos trabajando <br />
	16.1 En la pestaña iOS -> Push Notification Service subimos el nuevo archivo `.p12` que generamos por último y agregamos su contraseña <br />

*En este punto ya configuramos las push notifications para iOS. Si seguiste la guía para Android no hace falta agregar mas código en la aplicación. Solo debemos buscar el Token para el dispositivo iOS que queremos usar para pruebas (lo hacemos al igual que en android) y probamos (el request por postman es el mismo, solo debemos agregar el token del dispositivo).*
*Si no seguiste la guía para Android, puedes volver a la última parte de configuración de la APP y seguir los pasos desde allí*

## NOTA
En Xcode 8 y superior debemos asegurarnos en que esten activas las Push Notifications en el proyecto, para ellos solo debemos hacer lo siguiente: <br />
 - Ir a Capabilities y seleccionamos Push notifications (deben estar en ON)

*También puedes seguir esta guía `http://docs.ionic.io/services/profiles/`*


## Subida APK al Android Market
A continuación se explicará como generar el apk al Android Console: <br />
Link: https://developer.android.com/distribute/console/index.html?hl=es-419<br />

*Tomar en cuenta que esta guia es para clientes que ya tienen una ficha creada, de no tenerla hay que crearla antes de hacer estos pasos.*<br />
*Tambien se debe tomar en cuenta que los certificados de notificaciones están creados y configurados en: https://onesignal.com/.*<br />

1. Revisar la versión actual que tiene el cliente en el Android Console. <br />
2. Configurar el cliente que se desea actualizar. <br />
	2.1. En la carpeta del proyecto ingresar a: assets/env/[cliente]/config.xml. <br />
		2.1.1. En la parte superior del archivo modificar "version" y "android-versionCode", siguiendo la estructura que tiene el archivo. <br />
		2.1.2. Verificar el "id" sea el del cliente. (Se puede revisar en la Consola de Android). <br />
	2.2. En la carpeta del proyecto ingresar a: assets/env/[cliente]/[env].json (Si el app va a producción es el "pr.json"). <br />
		2.2.1. Revisar las direcciones de los Apis (Api phalcon y Api Cake). <br />
		2.2.2. Modificar la versión del app. <br />
		2.2.3. Revisar el IONIC->app_id que sea el correcto. (https://onesignal.com/) <br />
3. Con la consola ir a la carpeta del app. <br />
	3.1. Ejecutar el siguiente comando: gulp sign-app-full <br />
		3.1.1. Ingresar el ambiente (pr) y el cliente. <br />
		3.1.2. Va a llegar un punto en que se va a ejecutar una tarea de los plugins. Hay que revisar que ningún plugin falle. En caso de fallar hay que hacer otra vez el paso 3. <br />
		3.1.3. Luego se va a hacer el build y la consola pedira una clave y una versión. Antes de ingresar la clave y la versión, hay que copiar los iconos que estan en assets/env/[cliente]/resources/iconos/ y pegarlos en platforms/android/res/ <br />
		3.1.4. Se generará el apk firmado en la carpeta release con el nombre del cliente, ambiente y fecha de creación. <br />
	3.2 Instalar el apk firmado en un teléfono y verificar lo siguiente: <br />
		3.2.1. Recepción de las notificaciones con su respectivo icono. <br />
		3.2.2. Tomar fotos. <br />
		3.2.3. (Opcional) probar mas funcionalidades. <br />
		3.2.4. Iconos y Splash. <br />
4. Ingresar al Android Console e ingresar al cliente que se desea actualizar. <br />
	4.1. En el menu de la izquierda ingresar en: "Gestión de versiones" y luego "Versiones de la aplicación" <br />
	4.2. Dependiendo del ambiente en que esté la aplicaciones hacer click en "ADMINISTRAR VERSIÓN [AMBIENTE -> (Producción, Beta, Alfa)]" <br />
	4.3. Arriba hacer click a "Crear/Editar Versión". <br />
	4.4. En "APKs para añadir", subir apk firmada del cliente y esperar. <br />
	4.5. Una vez subida el apk bajar hasta el final del formulario y apretar el botón "GUARDAR" y por último el boton "Revisar". <br />
	4.6. La aplicación entrará a un proceso de revisión por parte de android para luego ser visualizada en la tienda. <br />


## Configuración de OneSignal en IOS (Push notification)

*Guía para notificaciones de OneSignal en IOS* <br />
*Estos pasos se deben hacer al menus una vez por cliente y si hay que borrar la carpeta de IOS de platform, hay que volver a hacer la guia otra vez.* <br />

Hacer los siguientes pasos que se van a comentar a continuación:

1. Ingresar al siguiente link: https://documentation.onesignal.com/v3.0/docs/ios-sdk-setup <br />
	1.1. En el paso 1 hacer desde el 1.1 hasta el 1.4. <br />
	1.2. En el paso 2 hacer los pasos: 2.1, 2.5, 2.6 y 2.7. (Estos pasos se hacen en la carpeta platform->ios) <br />
	1.3. En el paso 3 completo. <br />
2. De no existir el cliente en OneSignal o no estar configurado, ingresar y hacer todos los pasos de este link: https://documentation.onesignal.com/v3.0/docs/generate-an-ios-push-certificate <br />
3. Ingresar al siguiente link: https://documentation.onesignal.com/v3.0/docs/ionic-sdk-setup <br />
	3.1. Ir al paso 5 y hacerlo completo. <br />
4. Como último paso en el "Apple Developer" <br />
	4.1. En Identifiers crear uno que sea [ID del cliente].OneSignalNotificationServiceExtension <br />
	4.2. Una vez creado el identifiers, ir a Rovisioning Profiles -> Distribution, y crear uno que este vinculado al Identifier anterior. <br />
		4.2.1. El nombre debe ser [cliente]-onesignal. <br />
		4.2.1. Descargar el Provisioning Profile y guardarlo en la carpeta correspondiente en: Documents->Certificados. <br />
	4.3. Ingresar al "Target": OneSignalNotificationServiceExtension (El que se creo en el paso 1). <br />
		4.3.1. Deseleccionar en "Signing" -> "Automatically manage signing". <br />
		4.3.2. Deseleccionar en "Signing (Debug)" y "Signing (release)" se debe importar el "Provisioning Profile" creado en el paso 4.1. <br />
		4.3.3. Verificar que el Bundle Identifier sea [ID cliente].OneSignalNotificationServiceExtension y la versión sea la misma del "Target" con el nombre del cliente. <br />

*Se recomienda hacer esta guia y crear carpetas de app por cliente para hacer esta configuración.* <br />

## Subida APP Apple Store

A continuación se explicará como generar y subir el app al Apple Developer: <br />
Links: https://developer.apple.com/account y https://itunesconnect.apple.com/<br />

*Tomar en cuenta que esta guia es para clientes que ya tienen una cuenta creada, de no tenerla hay que crearla antes de hacer estos pasos.*<br />
*Deben estar creados los respectivos Certificates, Identifiers y Provisioning Profiles.*<br />
*Todos los pasos se deben hacer en la MAC.*<br />
*Tambien se debe tomar en cuenta que los certificados de notificaciones están creados y configurados en: https://onesignal.com/.*<br />
*Tambien se debe tomar en cuenta que el plugin de las noficaciones ya esta configurado e instalado en la carpeta del app del cliente.*<br />

1. Revisar la versión actual que tiene el cliente en el Itunes Connect. <br />
2. Configurar el cliente que se desea actualizar. <br />
	2.1. En la carpeta del proyecto ingresar a: assets/env/[cliente]/config.xml. <br />
		2.1.1. En la parte superior del archivo modificar "version" y "android-versionCode", siguiendo la estructura que tiene el archivo. <br />
		2.1.2. Verificar el "id" sea el del cliente. (Se puede revisar en el Itunes Connect). <br />
	2.2. En la carpeta del proyecto ingresar a: assets/env/[cliente]/[env].json (Si el app va a producción es el "pr.json"). <br />
		2.2.1. Revisar las direcciones de los Apis (Api phalcon y Api Cake). <br />
		2.2.2. Modificar la versión del app. <br />
		2.2.3. Revisar el IONIC->app_id que sea el correcto. (https://onesignal.com/) <br />
3. Con la consola ir a la carpeta del app. <br />
	3.0. Hacer ionic serve y seleccionar el cliente y el env. <br />
	3.1. Ejecutar el siguiente comando: ionic resources. <br />
	3.2. Ejecutar el siguiente comando: ionic build ios. <br />
	3.3. Al finalizar ingresar con el "Finder" en platforms->ios. <br />
	3.4. Buscar y abrir con doble click el archivo: [nombre cliente].xcworkspace. Se abrirá el xcode. <br />
	3.5. Seleccionar en "Target el cliente". <br />
		3.5.1. En el menu de arriba seleccionar "General". <br />
			3.5.1.1. Verificar en "Identity" el Bundle Identifier sea el de Itunes Connect y la versión sea la correcta. <br />
			3.5.1.2. En "Signing" deseleccionar "Automatically manage signing". <br />
			3.5.1.3. En "Signing (Debug)" y "Signing (Release)", hacer click en Provisioning Profile y seleccionar [cliente]-prod (.mobileprovision). (De no tener hay que importarlo). <br />
				3.5.1.3.1. En caso de no aparecer el provisioning profile hay que importarlo. La ruta de los certificados es: Documents->Certificados->[cliente]->prod o produccion. <br />
				3.5.1.3.2. De no existir el provisioning profile hay que generarlo desde el "Apple Developer", exportarlo y luego importarlo en el xcode. <br />
		3.5.2. En el menu de arriba seleccionar "Capabilities". <br />
			3.5.2.1. Verificar que el swich de "Push Notifications" este en ON y al desplegar "Push Notification" deben estar los dos "Steps" con un check. De no estarlo hay que hacer un clean del proyecto, cerrar y volver a abrir el xcode con como el paso 3.4. <br />
		3.5.3. En el menu de arriba seleccionar "Info". <br />
			3.5.3.1. Verificar que los siguientes "Keys" estén agregados: <br />
				3.5.3.1.1. "Privacy - Media Library Usage Description" - Value: "La aplicación  te deja elegir entre tus fotos para seleccionarla al reportar." <br />
				3.5.3.1.2. "Privacy - Camera Usage Description" - Value: "La aplicación accede a la cámara para poder reportar materiales, campañas, entre otros." <br />
				3.5.3.1.3. "Privacy - Location Usage Description" - Value: "Al momento de reportar guardaremos la dirección para saber donde se hizo el reporte." <br />
				3.5.3.1.4. "Privacy - Photo Library Usage Description" - Value: "La aplicación  te deja elegir entre tus fotos para seleccionarla al reportar." <br />
	3.6. En xcode hacer build de la aplicación <br />
		3.6.1. Arriba en el menu: Product->Build <br />
			3.6.1.1. Debe salir un mensaje que dice "Build Succeeded". En caso de fallar revisar la razón y solucionar (Paso obvio :D). <br />
				3.6.1.1.1. Aparecerá un warning en la columna de la izquierda con respecto a una imagen 1024 * 1024 que hay que subir manualmente (Paso muy imporante). <br />
					3.6.1.1.1.1. Al hacer doble click en el warning aparecerá una nueva ventana en donde hay que búscar el icono del warning y agregarlo manualmente  <br />
		3.6.2. Arriba en el menu: Product->Build y el Product->Archive (En caso de no salir la opcion de Archive, hacer un run al iphone) <br />
			3.6.2.1. Al finalizar, aparecerá una nueva ventana en donde hay que seleccionar el App que se compilo y seleccionar a la derecha Upload to App Store <br />
			3.6.2.2. Seguir los pasos hasta envíar la aplicación. <br />
4. Ingresar al Itunes Connect y al cliente que se va a actualizar. <br />
	4.1. Ir a la pestaña de Activity <br />
		4.1.1. Aprecerá la versión que se subió y hay que esperar que se haga la primera revisión. <br />
		4.1.2. Al terminar la revisión es recomendable hacer un "TestFlight" para probar lo siguiente: <br />
		      - Puede que aparezca un warning indicando "Missing Compliance", se debe hacer click sobre el icono amarillo y seleccionar "yes" luego aplicar en next.
		      - El resto es sleccionar "No" y next.
			4.1.2. Al terminar la revisión es recomendable hacer un "TestFlight" para probar lo siguiente: <br />
				4.1.2.1. Recepción de las notificaciones con su respectivo icono. <br />
				4.1.2.2. Tomar fotos. <br />
				4.1.2.3. (Opcional) probar mas funcionalidades. <br />

	4.2. Ingresar a la pestaña de "App Store". <br />
		4.2.1. De no existir la nueva versión crearla donde dice: "+ VERSION" y seleccionar IOS. <br />
		4.2.2. Una vez dentro de la versión que se quiere subir hay que buscar en el formulario la sección de "Build" y hacer click en el simbolo de "+". <br />
			4.2.2.1. Aparecerá disponible la versión que se quiere subir y hay que seleccionarlo. <br />
		4.2.3. Se deben guardar los cambios en el botón "Save" y luego mandar la revisión en el botón "Submit for Review". <br />

## Guia para congiruación para que funcionen los APIS con SSL en Android y IOS.
http://ivancevich.me/articles/ignoring-invalid-ssl-certificates-on-cordova-android-ios/



Pasos para deploy:
* Para comenzar con este paso se debe tener un proyecto de app ionic ya creado
1. Ingresar a https://dashboard.ionicframework.com/apps  y hacer login con ionic@andain.cl @ andain5546
	1.1 Click en New App, seleccionar nombre y crear app
  2. Una vez que el proyecto esté creado, seleccionar opción “Channels”, click en rama “Production” y seleccionar opción “Download updates in splashscreen and Install immediately” presente en el selector, copiar y pegar el código generado en una consola dentro del proyecto ionic (Con esto ya tenemos instalado el plugin para deploy)
3. Generar nueva versión de apk con el comando ionic Cordova build Android/Ios
4. Luego de hacer cambios en la app, se ejecutan los siguientes comandos:
    1.  git add -p (para hacer el merge respectivo a los cambios realizados)
    2.  git commit -m 'descripción del commit' (Sube el commit con los cambios realizados)
    3.  git push ionic master
5. Seleccionar opcion Builds e ingresar a la opción Deploy, seleccionar el canal production y clickear en Deploy (Con esto, nuestra app se actualizará automáticamente en cada dispositivo que la tenga instalada)

  B.T. Para subir la app en stores es necesario que se encuentre firmada, para eso se deben ejecutar los siguiente comandos:
	Android/Play Store (solo en caso de que no se halla firmado previamente): 
		- keytool -genkey -v -keystore miapp.keystore -alias miapp -keyalg RSA -keysize 2048 -validity 10000, en donde:
			miapp.keystore: Nombre del archivo que se generará con la clave respectiva.
			alias: nombre de identificación para la clave.
			keysize: tamaño de la clave (dejar en 2048)
			validity: Periodo de validez de la clave en dias (dejar en 10000)
		- jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore visual.keystore -storepass andainandain app-release-unsigned.apk visual (se debe estar 		 		   posicionado en carpeta que contenga la apk y el keystore)
		- jarsigner -verify -verbose -certs app-release-unsigned.apk
		- /Users/nombreusuario/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 app-release-unsigned.apk clientegc-version.apk (generamos apk nueva )
		- Seguir con pasos para subida Android
	Ios:
	npm install -g ios-deploy (es posible que nos solicite instalar esta dependencia)
	Continuar con paso para subida de app en AppStore


Para subir dos app iguales:

- Cambiar id y name en config.xml
- ionic cordova platform remove android /ios
-  ionic cordova platform add android/ios

Commit en ionic pro (revisar si se subio al repositorio asignado a cliente respectivo)


git commit -m ‘descripcion del commit’
git push ionic master
    

# ZONAL RIPLEY 13675041-0
# PAIS RIPLEY 12923655-8

Gestión comercial es una solución que pone a disposición de la Empresa, Ejecutivos y Colaboradores un conjunto de herramientas enfocadas en dos aspectos principales: Incrementar la productividad de tu equipo y mejorar la ejecución en los puntos de venta.

# La aplicación te deja usar el calendario para reportar.
# La aplicación te deja usar la detección de movimiento para reportar.
# La aplicación desea acceder a la cámara para tomar fotografías y asociarlas a tus reportes. Tus fotografías no serán compartidas sin tu permiso.
# La aplicación sólo verá el estado de tu bluetooth (encendido o apagado). No intercambiaremos archivos mediante esta vía.
# La aplicación te deja usar el micrófono para adjuntar notas de voz. No se usará sin tu permiso.
# La aplicación te deja usar el recordatorio para reportar.
# La aplicación desea acceder a sus contactos para que pueda iniciar conversaciones, no compartiremos tu información.
# La aplicación desea acceder a tu galería para que adjuntes fotografías a tus reportes, Tus fotografías no serán compartidas sin tu permiso.
# La aplicación desea acceder a su ubicación para mostrarla en la aplicación, también para calcular distancias entre su punto y sus sucursales. Es seguro y privado.


# AGREGAR A Info.Plist

# Privacy - Reminders Usage Description: La aplicación te deja usar el recordatorio para reportar.
# Privacy - Photo Library Usage Description: La aplicación desea acceder a tu galería para que adjuntes fotografías a tus reportes, Tus fotografías no serán compartidas sin tu permiso.
# Privacy - Location Always and When In Use Usage Description/Location When In Use Usage Description/Location Always Usage Description: La aplicación desea acceder a su ubicación para mostrarla en la aplicación, también para calcular distancias entre su punto y sus sucursales. Es seguro y privado.
# Privacy - Camera Usage Description: La aplicación desea acceder a la cámara para tomar fotografías y asociarlas a tus reportes. Tus fotografías no serán compartidas sin tu permiso.
# Privacy - Bluetooth Peripheral Usage Description: La aplicación te deja usar el bluetooth al reportar, este no será utilizado sin tu permiso.
# Privacy - Microphone Usage Description: La aplicación te deja usar el micrófono para enviar audios, no se usará sin tu permiso.
# Privacy - Motion Usage Description: La aplicación te deja usar la detección de movimiento para reportar.
# Privacy - Calendars Usage Description: La aplicación te deja usar el calendario para reportar.
# Privacy - Contacts Usage Description: La aplicación desea acceder a sus contactos para que pueda iniciar conversaciones.

# ADICIONAR:
# Privacy - Photo Library Additions Usage Description: La aplicación desea guardar las fotografías en tu galería. Estas no serán compartidas sin tu permiso.
# Privacy - Bluetooth Always Usage Description: La aplicación te deja usar el bluetooth al reportar, este no será utilizado sin tu permiso.
# NSPhotoLibraryAddUsageDescription: La aplicación desea acceder a tu galería para guardar fotografías, estas no serán compartidas sin tu permiso.
# TEXTO PARA CAMPO NUEVO BLUETOOTH: NSBluetoothAlwaysUsageDescription (Bluetooth Always Usage Description): La aplicación sólo verá el estado de tu bluetooth (encendido o apagado). No intercambiaremos archivos mediante esta vía.


# POSIBLES CONTRASEÑAS PARA LOS CERTIFICADOS DE IOS (PUSH)

Andain5546
andainandain
aNDAIN5546

# SI ENCUENTRAS OTRA, PORFAVOR AGRÉGALA ACÁ. GRACIAS!!! :D

# GESTIONAR COCOAPODS

sudo gem uninstall cocoapods
sudo gem install cocoapods -v <version>

# Para problemas con googlemaps en ios
en platforms/ios
pod install
pod update

ionic cordova prepare -> instala cordova plugins en package.json

<resource-file src="resources/android/icon/ic_notification/drawable-xxxhdpi/ic_stat_icon_250x250.png" target="app/src/main/res/main/drawable-xxxhdpi/ic_stat_icon_250x250.png" />

# GENERADOR DE ÍCONOS PUSH
https://romannurik.github.io/AndroidAssetStudio/icons-notification.html#source.type=clipart&source.clipart=ac_unit&source.space.trim=1&source.space.pad=0&name=ic_stat_ac_unit

# MUY BUEN ARTÍCULO SOBRE EL CICLO DE VIDA DE LAS PÁGINAS EN IONIC
https://saniyusuf.com/ionic-by-component-page-lifecycle/


# PLUGINS V6.2.10

com-badrit-base64 0.2.0 "Base64"
cordova-open-native-settings 1.5.2 "Native settings"
cordova-plugin-android-permissions 1.0.0 "Permissions"
cordova-plugin-app-version 0.1.9 "AppVersion"
cordova-plugin-calendar 5.1.4 "Calendar"
cordova-plugin-camera 4.0.3 "Camera"
cordova-plugin-compat 1.2.0 "Compat"
cordova-plugin-console 1.1.0 "Console"
cordova-plugin-datepicker 0.9.3 "DatePicker"
cordova-plugin-device 2.0.2 "Device"
cordova-plugin-file 6.0.1 "File"
cordova-plugin-file-transfer 1.7.1 "File Transfer"
cordova-plugin-fullscreen 1.1.0 "cordova-plugin-fullscreen"
cordova-plugin-geolocation 4.0.1 "Geolocation"
cordova-plugin-google-analytics 1.8.6 "Google Universal Analytics Plugin"
cordova-plugin-googlemaps 2.5.3 "cordova-plugin-googlemaps"
cordova-plugin-inappbrowser 3.0.0 "InAppBrowser"
cordova-plugin-insomnia 4.3.0 "Insomnia (prevent screen sleep)"
cordova-plugin-ionic 5.3.0 "cordova-plugin-ionic"
cordova-plugin-ionic-keyboard 2.1.3 "cordova-plugin-ionic-keyboard"
cordova-plugin-ionic-webview 2.3.1 "cordova-plugin-ionic-webview"
cordova-plugin-media 5.0.2 "Media"
cordova-plugin-media-capture 3.0.2 "Capture"
cordova-plugin-network-information 2.0.1 "Network Information"
cordova-plugin-request-location-accuracy 2.2.3 "Request Location Accuracy"
cordova-plugin-splashscreen 5.0.2 "Splashscreen"
cordova-plugin-statusbar 2.4.2 "StatusBar"
cordova-plugin-whitelist 1.3.3 "Whitelist"
cordova.plugins.diagnostic 4.0.12 "Diagnostic"
onesignal-cordova-plugin 2.4.6 "OneSignal Push Notifications"
phonegap-plugin-barcodescanner 8.0.1 "BarcodeScanner"
sentry-cordova 0.12.3 "Sentry"

adb -d logcat cl.newcolgram.gcapp:I *:S

