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

const filterBulan =
  document.getElementById(
    'filterBulan'
  );

const filterJenis =
  document.getElementById(
    'filterJenis'
  );

const filterPanel =
  document.getElementById(
    'filterPanel'
  );

const btnFilter =
  document.getElementById(
    'btnFilter'
  );


let rowYangAkanDihapus = null;
let transaksiRingkasan = [];


/* =========================================
   SAAT WEBSITE DIBUKA
========================================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    loadMonths();

    loadRingkasan();

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

        filterBulan.add(
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
   LOAD RINGKASAN SELURUH PERIODE
========================================= */

async function loadRingkasan() {

  const summaryStatus =
    document.getElementById('summaryStatus');

  try {

    summaryStatus.textContent = 'Memuat...';

    const response =
      await fetch(
        API_URL + '?action=ringkasan'
      );

    const result =
      await bacaResponseJSON(response);

    if (!result.success) {
      throw new Error(result.message);
    }

    const summary = result.data;
    transaksiRingkasan = summary.transaksi;

    document.getElementById('totalSaldo').textContent =
      formatRupiah(summary.totalSaldo);

    document.getElementById('totalPemasukan').textContent =
      formatRupiah(summary.totalPemasukan);

    document.getElementById('totalPengeluaran').textContent =
      formatRupiah(summary.totalPengeluaran);

    renderTransactions(summary.transaksi);

    summaryStatus.textContent =
      'Diperbarui ' +
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

  } catch (error) {

    console.error(error);
    summaryStatus.textContent =
      'Gagal memuat ringkasan';

  }

}


function renderTransactions(transaksi) {

  const bulan = filterBulan.value;
  const jenis = filterJenis.value;
  const filteredTransactions = transaksi.filter(function(item) {
    return (!bulan || item.bulan === bulan) &&
      (!jenis || item.jenis === jenis);
  });

  riwayatBody.innerHTML = '';

  if (filteredTransactions.length === 0) {
    loadingRiwayat.style.display = 'block';
    loadingRiwayat.textContent =
      'Tidak ada transaksi yang sesuai filter.';
    return;
  }

  loadingRiwayat.style.display = 'none';

  filteredTransactions.forEach(function(item) {
    const tr = document.createElement('tr');
    const badgeClass =
      item.jenis === 'Pemasukan'
        ? 'badge-pemasukan'
        : 'badge-pengeluaran';

    tr.innerHTML = `
      <td><strong>${escapeHTML(item.bulan)}</strong></td>
      <td>${escapeHTML(item.namaBarang)}</td>
      <td>${escapeHTML(item.tanggal)}</td>
      <td>
        <span class="badge ${badgeClass}">
          ${escapeHTML(item.jenis)}
        </span>
      </td>
      <td>${formatNominal(item.nominal)}</td>
      <td>${escapeHTML(item.diinputOleh)}</td>
      <td>${escapeHTML(item.keterangan)}</td>
      <td>
        <button
          class="btn-hapus"
          type="button"
          title="Hapus transaksi"
          aria-label="Hapus transaksi ${escapeHTML(item.namaBarang)}"
          onclick="konfirmasiHapus(${item.row})"
        >
          🗑️
        </button>
      </td>
    `;

    riwayatBody.appendChild(tr);
  });

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


      form.reset();


      setTanggalHariIni();


      await loadRingkasan();


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


filterBulan.addEventListener(
  'change',
  function() {
    renderTransactions(transaksiRingkasan);
  }
);

filterJenis.addEventListener(
  'change',
  function() {
    renderTransactions(transaksiRingkasan);
  }
);

btnFilter.addEventListener(
  'click',
  function() {
    const isOpen = !filterPanel.hidden;
    filterPanel.hidden = isOpen;
    btnFilter.setAttribute('aria-expanded', String(!isOpen));
  }
);


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


        await loadRingkasan();


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