import { Router } from "express";

const router = Router();

/*
=====================================================
GET /captcha
=====================================================
CAPTCHA page shown inside the React Native WebView.
=====================================================
*/

router.get("/", (_req, res) => {
  const siteKey = process.env.TURNSTILE_SITE_KEY;

  /*
  -----------------------------------------------------
  CHECK SITE KEY
  -----------------------------------------------------
  */

  if (!siteKey) {
    return res.status(500).send(`
      <!DOCTYPE html>

      <html>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>CAPTCHA Configuration Error</title>

          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
              background: #ffffff;
              color: #171717;
            }

            .error {
              max-width: 420px;
              margin: 60px auto;
              text-align: center;
            }

            h2 {
              color: #c62828;
            }

            p {
              color: #737373;
            }
          </style>
        </head>

        <body>

          <div class="error">

            <h2>
              CAPTCHA Configuration Error
            </h2>

            <p>
              TURNSTILE_SITE_KEY is missing.
            </p>

          </div>

        </body>
      </html>
    `);
  }

  /*
  -----------------------------------------------------
  RESPONSE HEADERS
  -----------------------------------------------------
  */

  res.setHeader(
    "Content-Type",
    "text/html; charset=utf-8"
  );

  /*
  -----------------------------------------------------
  CAPTCHA HTML
  -----------------------------------------------------
  */

  return res.send(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <meta
          name="robots"
          content="noindex,nofollow"
        />

        <title>
          TUPC-OrderUp CAPTCHA
        </title>


        <!--
        =================================================
        CLOUDFLARE CONNECTION
        =================================================
        -->

        <link
          rel="preconnect"
          href="https://challenges.cloudflare.com"
        />


        <!--
        =================================================
        CLOUDFLARE TURNSTILE
        =================================================
        IMPORTANT:
        Turnstile must be loaded directly from
        challenges.cloudflare.com
        =================================================
        -->

        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          async
          defer
        ></script>


        <!--
        =================================================
        PAGE STYLES
        =================================================
        -->

        <style>

          * {
            box-sizing: border-box;
          }


          html,
          body {

            margin: 0;
            padding: 0;

            width: 100%;
            min-height: 100%;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            background: #ffffff;

          }


          body {

            display: flex;

            justify-content: center;

            align-items: center;

            padding: 16px;

          }


          .container {

            width: 100%;

            max-width: 420px;

          }


          .message {

            width: 100%;

            text-align: center;

            color: #737373;

            font-size: 13px;

            line-height: 18px;

            margin-bottom: 12px;

          }


          .turnstile-wrapper {

            width: 100%;

            display: flex;

            justify-content: center;

            align-items: center;

            min-height: 70px;

          }


          #turnstile-container {

            width: 100%;

            min-height: 65px;

            display: flex;

            justify-content: center;

            align-items: center;

          }


          .error-message {

            display: none;

            margin-top: 10px;

            text-align: center;

            color: #c62828;

            font-size: 12px;

            line-height: 17px;

          }

        </style>

      </head>


      <body>

        <div class="container">

          <!--
          ===============================================
          DESCRIPTION
          ===============================================
          -->

          <div class="message">
            Complete the security verification below.
          </div>


          <!--
          ===============================================
          TURNSTILE CONTAINER
          ===============================================
          -->

          <div class="turnstile-wrapper">

            <div id="turnstile-container"></div>

          </div>


          <!--
          ===============================================
          ERROR MESSAGE
          ===============================================
          -->

          <div
            id="error-message"
            class="error-message"
          >
            Unable to load the security verification.
            Please try again.
          </div>

        </div>


        <!--
        =================================================
        JAVASCRIPT
        =================================================
        -->

        <script>

          /*
          =================================================
          SEND MESSAGE TO REACT NATIVE
          =================================================
          */

          function sendMessage(data) {

            try {

              if (
                window.ReactNativeWebView &&
                typeof window.ReactNativeWebView.postMessage ===
                  "function"
              ) {

                window.ReactNativeWebView.postMessage(
                  JSON.stringify(data)
                );

              }

            } catch (error) {

              console.error(
                "React Native message error:",
                error
              );

            }

          }


          /*
          =================================================
          SHOW ERROR
          =================================================
          */

          function showError() {

            try {

              const errorElement =
                document.getElementById(
                  "error-message"
                );

              if (errorElement) {

                errorElement.style.display =
                  "block";

              }

            } catch (error) {

              console.error(
                "Unable to show CAPTCHA error:",
                error
              );

            }

          }


          /*
          =================================================
          TURNSTILE SUCCESS
          =================================================
          */

          function onTurnstileSuccess(token) {

            console.log(
              "TURNSTILE SUCCESS"
            );


            if (!token) {

              console.warn(
                "Turnstile returned an empty token."
              );

              return;

            }


            sendMessage({

              type:
                "captcha-success",

              token:
                String(token)

            });

          }


          /*
          =================================================
          TURNSTILE EXPIRED
          =================================================
          */

          function onTurnstileExpired() {

            console.log(
              "TURNSTILE EXPIRED"
            );


            sendMessage({

              type:
                "captcha-expired"

            });

          }


          /*
          =================================================
          TURNSTILE ERROR
          =================================================
          */

          function onTurnstileError(errorCode) {

            console.error(
              "TURNSTILE ERROR:",
              errorCode
            );


            showError();


            sendMessage({

              type:
                "captcha-error",

              message:
                "Cloudflare CAPTCHA could not be completed.",

              errorCode:
                errorCode || ""

            });

          }


          /*
          =================================================
          RENDER TURNSTILE
          =================================================
          */

          function renderTurnstile() {

            try {

              /*
              -------------------------------------------------
              WAIT UNTIL CLOUDFLARE TURNSTILE IS AVAILABLE
              -------------------------------------------------
              */

              if (
                typeof turnstile === "undefined"
              ) {

                console.log(
                  "Waiting for Cloudflare Turnstile..."
                );


                setTimeout(
                  renderTurnstile,
                  300
                );


                return;

              }


              /*
              -------------------------------------------------
              GET CONTAINER
              -------------------------------------------------
              */

              const container =
                document.getElementById(
                  "turnstile-container"
                );


              if (!container) {

                console.error(
                  "Turnstile container not found."
                );


                sendMessage({

                  type:
                    "captcha-error",

                  message:
                    "CAPTCHA container was not found."

                });


                return;

              }


              /*
              -------------------------------------------------
              RENDER TURNSTILE
              -------------------------------------------------
              */

              turnstile.render(
                container,
                {

                  sitekey:
                    "${siteKey}",

                  theme:
                    "light",

                  callback:
                    onTurnstileSuccess,

                  "expired-callback":
                    onTurnstileExpired,

                  "error-callback":
                    onTurnstileError

                }
              );


              console.log(
                "TURNSTILE RENDERED SUCCESSFULLY"
              );

            } catch (error) {

              console.error(
                "TURNSTILE RENDER ERROR:",
                error
              );


              showError();


              sendMessage({

                type:
                  "captcha-error",

                message:
                  "Unable to initialize Cloudflare CAPTCHA."

              });

            }

          }


          /*
          =================================================
          PAGE LOAD
          =================================================
          */

          window.addEventListener(
            "load",
            function () {

              console.log(
                "CAPTCHA PAGE LOADED"
              );


              renderTurnstile();

            }
          );

        </script>

      </body>

    </html>
  `);
});


/*
=====================================================
POST /captcha/verify
=====================================================
Cloudflare server-side token verification.
=====================================================
*/

router.post("/verify", async (req, res) => {

  try {

    /*
    -----------------------------------------------------
    READ SECRET KEY
    -----------------------------------------------------
    */

    const secret =
      process.env.TURNSTILE_SECRET_KEY;


    if (!secret) {

      console.error(
        "TURNSTILE_SECRET_KEY is missing."
      );


      return res.status(500).json({

        success: false,

        message:
          "Turnstile secret key is not configured."

      });

    }


    /*
    -----------------------------------------------------
    READ TOKEN
    -----------------------------------------------------
    */

    const { token } =
      req.body;


    if (
      !token ||
      typeof token !== "string"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "CAPTCHA token is required."

      });

    }


    /*
    -----------------------------------------------------
    PREPARE CLOUDFLARE REQUEST
    -----------------------------------------------------
    */

    const formData =
      new URLSearchParams();


    formData.append(
      "secret",
      secret
    );


    formData.append(
      "response",
      token
    );


    /*
    -----------------------------------------------------
    SEND TOKEN TO CLOUDFLARE
    -----------------------------------------------------
    */

    const cloudflareResponse =
      await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded"

          },

          body:
            formData.toString()

        }
      );


    /*
    -----------------------------------------------------
    CHECK HTTP RESPONSE
    -----------------------------------------------------
    */

    if (!cloudflareResponse.ok) {

      console.error(
        "CLOUDFLARE HTTP ERROR:",
        cloudflareResponse.status
      );


      return res.status(502).json({

        success: false,

        message:
          "Cloudflare CAPTCHA verification service is unavailable."

      });

    }


    /*
    -----------------------------------------------------
    READ CLOUDFLARE RESULT
    -----------------------------------------------------
    */

    const result: any =
      await cloudflareResponse.json();


    /*
    -----------------------------------------------------
    CAPTCHA FAILED
    -----------------------------------------------------
    */

    if (!result.success) {

      console.error(
        "TURNSTILE VERIFICATION FAILED:",
        result
      );


      return res.status(403).json({

        success: false,

        message:
          "CAPTCHA verification failed.",

        errors:
          result["error-codes"] || []

      });

    }


    /*
    -----------------------------------------------------
    CAPTCHA SUCCESS
    -----------------------------------------------------
    */

    console.log(
      "TURNSTILE VERIFICATION SUCCESS"
    );


    return res.json({

      success: true,

      message:
        "CAPTCHA verified successfully."

    });

  } catch (error) {

    /*
    -----------------------------------------------------
    SERVER ERROR
    -----------------------------------------------------
    */

    console.error(
      "TURNSTILE SERVER ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to verify CAPTCHA."

    });

  }

});


/*
=====================================================
GET /captcha/health
=====================================================
Quick health check.
=====================================================
*/

router.get(
  "/health",
  (_req, res) => {

    return res.json({

      success: true,

      message:
        "TUPC-OrderUp CAPTCHA route is running"

    });

  }
);


/*
=====================================================
EXPORT
=====================================================
*/

export default router;