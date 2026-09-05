/* =========================================
   KONFIGURASI API
========================================= */

const API_URL = '/api';




async function bacaResponseJSON(response) {

  const text =
    await response.text();

  let result;


  try {
    result = JSON.parse(text);
  }

  catch (error) {
    throw new Error(
      'Server mengembalikan halaman HTML, bukan JSON. Pastikan URL Google Apps Script dan deployment-nya benar.'
    );
  }


  if (!response.ok) {
    throw new Error(
      result.message ||
      'Server gagal memproses permintaan.'
    );
  }


  return result;

}


/* =========================================
   ELEMENT
========================================= */

const form =
  document.getElementById(
    'formTransaksi'
  );

const bulanSelect =
  document.getElementById(
    'bulan'
  );

const bulanRiwayat =
  document.getElementById(
    'bulanRiwayat'
  );

const riwayatBody =
  document.getElementById(
    'riwayatBody'
  );

const loadingRiwayat =
  document.getElementById(
    'loadingRiwayat'
  );

const btnSimpan =
  document.getElementById(
    'btnSimpan'
  );


let rowYangAkanDihapus = null;


/* =========================================
   SAAT WEBSITE DIBUKA
========================================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    loadMonths();

    setTanggalHariIni();

  }
);


/* =========================================
   SET TANGGAL HARI INI
========================================= */

function setTanggalHariIni() {

  const tanggal =
    new Date()
      .toISOString()
      .split('T')[0];

  document
    .getElementById('tanggal')
    .value = tanggal;

}


/* =========================================
   AMBIL DAFTAR BULAN
========================================= */

async function loadMonths() {

  try {

    const response =
      await fetch(
        API_URL +
        '?action=months'
      );

    const result =
      await bacaResponseJSON(response);


    if (!result.success) {
      throw new Error(
        result.message
      );
    }


    result.data.forEach(
      function(bulan) {

        bulanSelect.add(
          new Option(
            bulan,
            bulan
          )
        );

        bulanRiwayat.add(
          new Option(
            bulan,
            bulan
          )
        );

      }
    );

  }

  catch (error) {

    console.error(error);

    alert(
      'Gagal mengambil daftar bulan: ' +
      error.message
    );

  }

}


/* =========================================
   FORMAT RUPIAH INPUT
========================================= */

document
  .getElementById('nominal')
  .addEventListener(
    'input',
    function() {

      let value =
        this.value.replace(
          /[^\d]/g,
          ''
        );


      if (!value) {

        this.value = '';

        return;

      }


      this.value =
        'Rp ' +
        Number(value)
          .toLocaleString(
            'id-ID'
          );

    }
  );


/* =========================================
   SUBMIT FORM
========================================= */

form.addEventListener(
  'submit',
  async function(event) {

    event.preventDefault();


    const data = {

      action: 'tambah',

      bulan:
        document
          .getElementById('bulan')
          .value,

      namaBarang:
        document
          .getElementById('namaBarang')
          .value,

      tanggal:
        document
          .getElementById('tanggal')
          .value,

      jenis:
        document
          .getElementById('jenis')
          .value,

      nominal:
        document
          .getElementById('nominal')
          .value,

      diinputOleh:
        document
          .getElementById('diinputOleh')
          .value,

      keterangan:
        document
          .getElementById('keterangan')
          .value

    };


    try {

      bukaLoading(
        'Menyimpan Data...',
        'Mohon tunggu sebentar.'
      );


      btnSimpan.disabled = true;


      const response =
        await fetch(
          API_URL,
          {

            method: 'POST',

            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },

            body:
              JSON.stringify(data)

          }
        );


      const result =
        await bacaResponseJSON(response);


      if (!result.success) {

        throw new Error(
          result.message ||
          'Gagal menyimpan data.'
        );

      }


      const bulanDipilih =
        data.bulan;


      form.reset();


      setTanggalHariIni();


      bulanRiwayat.value =
        bulanDipilih;


      await loadRiwayat();


      tampilkanSuccessPopup(
        result.message ||
        'Data Anda sudah berhasil tercatat.'
      );

    }

    catch (error) {

      console.error(error);

      tampilkanErrorPopup(
        error.message ||
        'Terjadi kesalahan saat menyimpan data.'
      );

    }

    finally {

      btnSimpan.disabled = false;

    }

  }
);


/* =========================================
   PILIH BULAN RIWAYAT
========================================= */

bulanRiwayat.addEventListener(
  'change',
  loadRiwayat
);


document
  .getElementById('btnRefresh')
  .addEventListener(
    'click',
    loadRiwayat
  );


/* =========================================
   LOAD RIWAYAT
========================================= */

async function loadRiwayat() {

  const bulan =
    bulanRiwayat.value;


  if (!bulan) {

    loadingRiwayat.style.display =
      'block';

    loadingRiwayat.textContent =
      'Pilih bulan untuk melihat transaksi.';

    riwayatBody.innerHTML = '';

    return;

  }


  try {

    loadingRiwayat.style.display =
      'block';

    loadingRiwayat.textContent =
      'Memuat transaksi...';


    riwayatBody.innerHTML = '';


    const url =
      API_URL +
      '?action=riwayat&bulan=' +
      encodeURIComponent(bulan);


    const response =
      await fetch(url);


    const result =
      await bacaResponseJSON(response);


    if (!result.success) {

      throw new Error(
        result.message
      );

    }


    const transaksi =
      result.data;


    if (
      transaksi.length === 0
    ) {

      loadingRiwayat.style.display =
        'block';

      loadingRiwayat.textContent =
        'Belum ada transaksi pada bulan ini.';

      return;

    }


    loadingRiwayat.style.display =
      'none';


    transaksi.forEach(
      function(item) {

        const tr =
          document.createElement('tr');


        const badgeClass =
          item.jenis === 'Pemasukan'
            ? 'badge-pemasukan'
            : 'badge-pengeluaran';


        tr.innerHTML = `

          <td>${escapeHTML(item.namaBarang)}</td>

          <td>${escapeHTML(item.tanggal)}</td>

          <td>
            <span class="badge ${badgeClass}">
              ${escapeHTML(item.jenis)}
            </span>
          </td>

          <td>
            ${formatNominal(item.nominal)}
          </td>

          <td>
            ${escapeHTML(item.diinputOleh)}
          </td>

          <td>
            ${escapeHTML(item.keterangan)}
          </td>

          <td>

            <button
              class="btn-hapus"
              onclick="konfirmasiHapus(${item.row})"
            >
              🗑️
            </button>

          </td>

        `;


        riwayatBody.appendChild(tr);

      }
    );

  }

  catch (error) {

    console.error(error);


    loadingRiwayat.style.display =
      'block';


    loadingRiwayat.textContent =
      'Gagal memuat transaksi: ' +
      error.message;

  }

}


/* =========================================
   FORMAT RUPIAH
========================================= */

function formatRupiah(value) {

  const angka =
    Number(
      String(value)
        .replace(/[^\d]/g, '')
    );


  return angka.toLocaleString(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }
  );

}


/* =========================================
   FORMAT NOMINAL
========================================= */

function formatNominal(value) {

  const text =
    String(value ?? '')
      .trim();


  /*
    Tampilkan error Google Sheet apa adanya
  */

  if (
    text.includes('#REF!') ||
    text.includes('#VALUE!') ||
    text.includes('#ERROR!')
  ) {
    return `
      <span class="nominal-error">
        ⚠️ ${escapeHTML(text)}
      </span>
    `;
  }


  /*
    Nominal normal → format Rupiah
  */

  return formatRupiah(text);

}

/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

  if (
    text === null ||
    text === undefined
  ) {
    return '';
  }


  const div =
    document.createElement('div');


  div.textContent =
    text;


  return div.innerHTML;

}


/* =========================================
   POPUP LOADING
========================================= */

function bukaLoading(
  title,
  text
) {

  const overlay =
    document.getElementById(
      'popupOverlay'
    );


  overlay.style.display =
    'flex';


  document
    .getElementById(
      'loadingContent'
    )
    .style.display =
    'block';


  document
    .getElementById(
      'successContent'
    )
    .style.display =
    'none';


  document
    .getElementById(
      'errorContent'
    )
    .style.display =
    'none';


  document
    .getElementById(
      'loadingTitle'
    )
    .textContent =
    title;


  document
    .getElementById(
      'loadingText'
    )
    .textContent =
    text;

}


/* =========================================
   SUCCESS POPUP
========================================= */

function tampilkanSuccessPopup(message) {

  document
    .getElementById(
      'loadingContent'
    )
    .style.display =
    'none';


  document
    .getElementById(
      'successContent'
    )
    .style.display =
    'block';


  document
    .getElementById(
      'successMessage'
    )
    .textContent =
    message;

}


/* =========================================
   ERROR POPUP
========================================= */

function tampilkanErrorPopup(message) {

  const overlay =
    document.getElementById(
      'popupOverlay'
    );


  overlay.style.display =
    'flex';


  document
    .getElementById(
      'loadingContent'
    )
    .style.display =
    'none';


  document
    .getElementById(
      'successContent'
    )
    .style.display =
    'none';


  document
    .getElementById(
      'errorContent'
    )
    .style.display =
    'block';


  document
    .getElementById(
      'popupErrorMessage'
    )
    .textContent =
    message;

}


/* =========================================
   TUTUP POPUP
========================================= */

function tutupPopup() {

  document
    .getElementById(
      'popupOverlay'
    )
    .style.display =
    'none';

}


document
  .getElementById('btnSuccess')
  .addEventListener(
    'click',
    tutupPopup
  );


document
  .getElementById('btnError')
  .addEventListener(
    'click',
    tutupPopup
  );


/* =========================================
   KONFIRMASI HAPUS
========================================= */

function konfirmasiHapus(row) {

  rowYangAkanDihapus =
    row;


  document
    .getElementById(
      'deleteOverlay'
    )
    .style.display =
    'flex';

}


document
  .getElementById('btnCancelDelete')
  .addEventListener(
    'click',
    function() {

      document
        .getElementById(
          'deleteOverlay'
        )
        .style.display =
        'none';


      rowYangAkanDihapus =
        null;

    }
  );


/* =========================================
   HAPUS TRANSAKSI
========================================= */

document
  .getElementById('btnConfirmDelete')
  .addEventListener(
    'click',
    async function() {

      if (!rowYangAkanDihapus) {
        return;
      }


      document
        .getElementById(
          'deleteOverlay'
        )
        .style.display =
        'none';


      try {

        bukaLoading(
          'Menghapus Data...',
          'Mohon tunggu sebentar.'
        );


        const response =
          await fetch(
            API_URL,
            {

              method: 'POST',

              headers: {
                'Content-Type':
                  'text/plain;charset=utf-8'
              },

              body:
                JSON.stringify({

                  action: 'hapus',

                  row:
                    Number(rowYangAkanDihapus)

                })

            }
          );


        const result =
          await bacaResponseJSON(response);


        if (!result.success) {

          throw new Error(
            result.message
          );

        }


        await loadRiwayat();


        tampilkanSuccessPopup(
          result.message ||
          'Transaksi berhasil dihapus.'
        );


        rowYangAkanDihapus =
          null;

      }

      catch (error) {

        tampilkanErrorPopup(
          error.message ||
          'Gagal menghapus transaksi.'
        );

      }

    }
  );