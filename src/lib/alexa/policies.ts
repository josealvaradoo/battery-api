/**
 * Static policy documents served by the Alexa skill.
 * Amazon requires publicly accessible privacy policy and terms of use URLs
 * for skill certification, so these are served without authentication.
 */

/** Privacy policy HTML document (Spanish, es-US skill). */
export const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidad — Planta</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 700px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #222;
            background: #fff;
        }
        h1 { font-size: 1.5em; }
        h2 { font-size: 1.15em; margin-top: 1.8em; }
        p, li { font-size: 0.95em; }
        ul { padding-left: 1.2em; }
        .meta { color: #666; font-size: 0.85em; margin-bottom: 2em; }
    </style>
</head>
<body>
    <h1>Política de Privacidad</h1>
    <p class="meta">Última actualización: 17 de agosto de 2026</p>
    <h2>1. Datos que recopila esta skill</h2>
    <p>Esta skill <strong>no recopila, almacena ni comparte datos personales</strong> del usuario. La skill únicamente consulta datos de monitoreo de un inversor solar (batería, producción y consumo) desde un servidor privado, y devuelve esa información por voz al usuario.</p>
    <p>Los únicos datos procesados durante cada interacción son:</p>
    <ul>
        <li>El texto que el usuario dice a Alexa (procesado por Amazon, no por esta skill).</li>
        <li>Las lecturas del inversor solar que el usuario solicita (batería, producción, consumo).</li>
    </ul>
    <p>Ninguno de estos datos se almacena, se registra en bitácoras accesibles al público, ni se comparte con terceros.</p>
    <h2>2. Uso de los datos</h2>
    <p>Los datos del inversor solar se utilizan exclusivamente para responder a la solicitud del usuario en el momento de la consulta. No se realizan análisis, perfiles ni seguimiento de comportamiento.</p>
    <h2>3. Servicios de terceros</h2>
    <p>Esta skill no utiliza servicios de terceros para recopilar datos. La única comunicación es entre los servidores de Amazon Alexa y el servidor del desarrollador para procesar la solicitud.</p>
    <h2>4. Eliminación de datos</h2>
    <p>Como esta skill no almacena datos del usuario, no existe un proceso de eliminación. Puede eliminar la skill en cualquier momento desde la app Alexa en su dispositivo.</p>
    <h2>5. Cambios en esta política</h2>
    <p>Si esta política de privacidad se modifica, la fecha de actualización arriba será cambiada. Los cambios entrarán en vigor desde su publicación.</p>
    <h2>6. Contacto</h2>
    <p>Si tiene preguntas sobre esta política, puede contactar al desarrollador en: <strong>alexa@josealvarado.dev</strong></p>
</body>
</html>`;

/** Terms of use HTML document (Spanish, es-US skill). */
export const TERMS_OF_USE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Términos de Uso — Planta</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 700px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #222;
            background: #fff;
        }
        h1 { font-size: 1.5em; }
        h2 { font-size: 1.15em; margin-top: 1.8em; }
        p, li { font-size: 0.95em; }
        ul { padding-left: 1.2em; }
        .meta { color: #666; font-size: 0.85em; margin-bottom: 2em; }
    </style>
</head>
<body>
    <h1>Términos de Uso</h1>
    <p class="meta">Última actualización: 17 de agosto de 2026</p>
    <h2>1. Descripción del servicio</h2>
    <p><strong>Planta</strong> es una skill de Alexa que proporciona información de monitoreo de un inversor solar, incluyendo nivel de batería, producción solar y consumo del hogar. El servicio es de uso personal y gratuito.</p>
    <h2>2. Uso aceptable</h2>
    <p>El usuario se compromete a utilizar esta skill únicamente para su uso personal y doméstico. No está permitido utilizar la skill con fines comerciales, de reventa o de cualquier forma que pueda dañar o sobrecargar el servicio.</p>
    <h2>3. Disponibilidad</h2>
    <p>Esta skill se ofrece "tal cual" sin garantías de disponibilidad continua. El desarrollador se reserva el derecho de modificar, suspender o descontinuar el servicio en cualquier momento sin previo aviso.</p>
    <h2>4. Limitación de responsabilidad</h2>
    <p>La información proporcionada por la skill (lecturas de batería, producción y consumo) se basa en datos de monitoreo del inversor solar y se ofrece con fines informativos. El desarrollador no se hace responsable por decisiones tomadas en base a esta información. Se recomienda siempre consultar el panel de control del inversor para datos oficiales.</p>
    <h2>5. Propiedad intelectual</h2>
    <p>El código y contenido de esta skill son propiedad del desarrollador. El usuario no adquiere ningún derecho de propiedad sobre la skill al utilizarla.</p>
    <h2>6. Cambios en estos términos</h2>
    <p>El desarrollador se reserva el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor desde su publicación. El uso continuado de la skill implica la aceptación de los términos modificados.</p>
    <h2>7. Contacto</h2>
    <p>Si tiene preguntas sobre estos términos, puede contactar al desarrollador en: <strong>alexa@josealvarado.dev</strong></p>
</body>
</html>`;