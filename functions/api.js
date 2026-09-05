export async function onRequest(context) {

  const APPS_SCRIPT_URL =
    context.env.APPS_SCRIPT_URL;


  if (!APPS_SCRIPT_URL) {

    return Response.json(
      {
        success: false,
        message:
          'APPS_SCRIPT_URL belum dikonfigurasi di Cloudflare.'
      },
      {
        status: 500
      }
    );

  }


  const request =
    context.request;


  const incomingUrl =
    new URL(request.url);


  try {

    /* =========================================
       GET
    ========================================= */

    if (request.method === 'GET') {

      const targetUrl =
        new URL(APPS_SCRIPT_URL);


      incomingUrl.searchParams.forEach(
        function(value, key) {

          targetUrl.searchParams.set(
            key,
            value
          );

        }
      );


      const response =
        await fetch(
          targetUrl.toString(),
          {
            method: 'GET',
            redirect: 'follow'
          }
        );


      const text =
        await response.text();


      return new Response(
        text,
        {
          status: response.status,

          headers: {
            'Content-Type':
              'application/json; charset=utf-8'
          }
        }
      );

    }


    /* =========================================
       POST
    ========================================= */

    if (request.method === 'POST') {

      const body =
        await request.text();


      const response =
        await fetch(
          APPS_SCRIPT_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },

            body,

            redirect: 'follow'
          }
        );


      const text =
        await response.text();


      return new Response(
        text,
        {
          status: response.status,

          headers: {
            'Content-Type':
              'application/json; charset=utf-8'
          }
        }
      );

    }


    return Response.json(
      {
        success: false,
        message:
          'Method tidak diizinkan.'
      },
      {
        status: 405
      }
    );

  }


  catch (error) {

    return Response.json(
      {
        success: false,
        message:
          error.message ||
          'Terjadi kesalahan pada server.'
      },
      {
        status: 500
      }
    );

  }

}