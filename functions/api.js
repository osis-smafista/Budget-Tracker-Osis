const TIMEOUT_MS = 30000;
const MAX_GET_RETRIES = 2;


/* =========================================
   FETCH DENGAN TIMEOUT
========================================= */

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });

  } finally {
    clearTimeout(timeout);
  }
}


/* =========================================
   VALIDASI RESPONSE
========================================= */

function buatResponseJSON(text, status) {
  /*
    Kadang Apps Script mengembalikan HTML
    ketika deployment/error Google bermasalah.
  */

  const trimmedText = text.trim();

  if (
    trimmedText.startsWith('<!DOCTYPE') ||
    trimmedText.startsWith('<html')
  ) {
    return Response.json(
      {
        success: false,
        message:
          'Google Apps Script mengembalikan halaman HTML, bukan JSON. Coba lagi beberapa saat.'
      },
      {
        status: 502
      }
    );
  }


  return new Response(
    text,
    {
      status,

      headers: {
        'Content-Type':
          'application/json; charset=utf-8',

        'Cache-Control':
          'no-store'
      }
    }
  );
}


/* =========================================
   GET DENGAN RETRY
========================================= */

async function getWithRetry(targetUrl) {
  let lastError;

  for (
    let attempt = 1;
    attempt <= MAX_GET_RETRIES;
    attempt++
  ) {
    try {
      const response =
        await fetchWithTimeout(
          targetUrl,
          {
            method: 'GET',
            redirect: 'follow'
          }
        );


      /*
        Jika server error, coba ulang.
      */

      if (
        response.status >= 500 &&
        attempt < MAX_GET_RETRIES
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * attempt)
        );

        continue;
      }


      return response;

    } catch (error) {
      lastError = error;


      if (
        attempt < MAX_GET_RETRIES
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * attempt)
        );
      }
    }
  }


  throw lastError ||
    new Error('Gagal menghubungi server.');
}


/* =========================================
   CLOUDFLARE PAGES FUNCTION
========================================= */

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

    /* =====================================
       GET
    ===================================== */

    if (request.method === 'GET') {
      const targetUrl =
        new URL(APPS_SCRIPT_URL);


      /*
        Copy query parameter dari website
        ke Google Apps Script.
      */

      incomingUrl.searchParams.forEach(
        function(value, key) {
          targetUrl.searchParams.set(
            key,
            value
          );
        }
      );


      const response =
        await getWithRetry(
          targetUrl.toString()
        );


      const text =
        await response.text();


      return buatResponseJSON(
        text,
        response.status
      );
    }


    /* =====================================
       POST
    ===================================== */

    if (request.method === 'POST') {
      const body =
        await request.text();


      /*
        POST TIDAK DI-RETRY.

        Alasannya:
        Jika transaksi sebenarnya berhasil
        masuk ke Google Sheet tetapi response
        gagal diterima, retry bisa menyebabkan
        transaksi tercatat dua kali.
      */

      const response =
        await fetchWithTimeout(
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


      return buatResponseJSON(
        text,
        response.status
      );
    }


    /* =====================================
       METHOD TIDAK DIIZINKAN
    ===================================== */

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

  } catch (error) {

    console.error(
      'Proxy Error:',
      error
    );


    let message =
      'Terjadi kesalahan saat menghubungi server.';


    if (
      error.name === 'AbortError'
    ) {
      message =
        'Koneksi ke Google Apps Script terlalu lama. Silakan coba lagi.';
    }


    return Response.json(
      {
        success: false,
        message
      },
      {
        status: 504
      }
    );
  }
}