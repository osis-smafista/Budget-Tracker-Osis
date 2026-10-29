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

const sectionLaporan =
  document.getElementById('reportSection');

const sectionKelolaData =
  document.getElementById('managementSection');

const reportFilterBulan =
  document.getElementById('reportFilterBulan');

const reportFilterJenis =
  document.getElementById('reportFilterJenis');

const reportRiwayatBody =
  document.getElementById('reportRiwayatBody');

const reportLoadingRiwayat =
  document.getElementById('reportLoadingRiwayat');


let rowYangAkanDihapus = null;
let transaksiRingkasan = [];
let daftarBulan = [];
let passwordKelola = '';
let ringkasanDimuat = false;


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

        reportFilterBulan.add(
          new Option(
            bulan,
            bulan
          )
        );

      }
    );

    daftarBulan = result.data;
    if (ringkasanDimuat) {
      renderFinancialReport();
    }

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

  setSummaryLoading(true);
  setTransactionsLoading(true);

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
    ringkasanDimuat = true;

    document.getElementById('totalSaldo').textContent =
      formatRupiah(summary.totalSaldo);

    document.getElementById('totalPemasukan').textContent =
      formatRupiah(summary.totalPemasukan);

    document.getElementById('totalPengeluaran').textContent =
      formatRupiah(summary.totalPengeluaran);

    setSummaryLoading(false);

    renderTransactions(summary.transaksi);
    renderReportTransactions(summary.transaksi);
    renderFinancialReport();

    summaryStatus.textContent =
      'Diperbarui ' +
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });

  } catch (error) {

    console.error(error);
    setSummaryLoading(false);
    setTransactionsLoading(false);
    summaryStatus.textContent =
      'Gagal memuat ringkasan';
    document.getElementById('monthlyReportBody').innerHTML =
      '<tr><td colspan="4" class="report-empty">Gagal memuat laporan bulanan.</td></tr>';

  }

}

function renderReportTransactions(transaksi) {

  const bulan = reportFilterBulan.value;
  const jenis = reportFilterJenis.value;
  const filteredTransactions = transaksi.filter(function(item) {
    return (!bulan || item.bulan === bulan) &&
      (!jenis || item.jenis === jenis);
  });

  reportRiwayatBody.innerHTML = '';

  if (filteredTransactions.length === 0) {
    reportLoadingRiwayat.style.display = 'block';
    reportLoadingRiwayat.textContent =
      transaksi.length === 0
        ? 'Belum ada transaksi yang tercatat.'
        : 'Tidak ada transaksi yang sesuai filter.';
    return;
  }

  reportLoadingRiwayat.style.display = 'none';

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
    `;

    reportRiwayatBody.appendChild(tr);
  });

}


function renderFinancialReport() {

  const laporan = getMonthlyReportData();

  document.getElementById('monthlyReportBody').innerHTML =
    laporan.length
      ? laporan.map(function(item) {
        return `
          <tr>
            <td><strong>${escapeHTML(item.bulan)}</strong></td>
            <td class="amount-positive">${formatRupiah(item.pemasukan)}</td>
            <td class="amount-negative">${formatRupiah(item.pengeluaran)}</td>
            <td class="${item.saldo < 0 ? 'amount-negative' : 'amount-positive'}">${formatRupiah(item.saldo)}</td>
          </tr>
        `;
      }).join('')
      : '<tr><td colspan="4" class="report-empty">Belum ada data laporan.</td></tr>';

  drawMonthlyChart(laporan);

}


function drawMonthlyChart(laporan) {

  const canvas = document.getElementById('monthlyChart');
  const width = canvas.clientWidth;

  if (!width) {
    return;
  }

  const height = canvas.clientHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Browser tidak mendukung grafik laporan.');
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  if (!laporan.length) {
    context.fillStyle = '#667085';
    context.font = '14px "Trebuchet MS", sans-serif';
    context.textAlign = 'center';
    context.fillText('Belum ada data transaksi.', width / 2, height / 2);
    return;
  }

  const padding = { top: 14, right: 12, bottom: 36, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...laporan.map(function(item) {
      return Math.max(item.pemasukan, item.pengeluaran);
    })
  );
  const barWidth = Math.min(18, chartWidth / laporan.length * 0.28);
  const gridLines = 4;

  context.font = '11px "Trebuchet MS", sans-serif';
  context.textAlign = 'right';
  context.textBaseline = 'middle';

  for (let index = 0; index <= gridLines; index += 1) {
    const y = padding.top + chartHeight * index / gridLines;
    const value = maxValue * (gridLines - index) / gridLines;

    context.strokeStyle = '#e9eef3';
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    context.fillStyle = '#667085';
    context.fillText(
      formatCompactRupiah(value),
      padding.left - 8,
      y
    );
  }

  laporan.forEach(function(item, index) {
    const groupWidth = chartWidth / laporan.length;
    const center = padding.left + groupWidth * (index + 0.5);
    const incomeHeight = item.pemasukan / maxValue * chartHeight;
    const expenseHeight = item.pengeluaran / maxValue * chartHeight;
    const baseline = padding.top + chartHeight;

    context.fillStyle = '#1769aa';
    context.fillRect(
      center - barWidth - 2,
      baseline - incomeHeight,
      barWidth,
      incomeHeight
    );

    context.fillStyle = '#e16a73';
    context.fillRect(
      center + 2,
      baseline - expenseHeight,
      barWidth,
      expenseHeight
    );

    context.fillStyle = '#667085';
    context.font = '11px "Trebuchet MS", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(
      String(item.bulan).slice(0, 3),
      center,
      height - 11
    );
  });

}


function formatCompactRupiah(value) {

  if (value >= 1000000000) {
    return 'Rp ' + (value / 1000000000).toFixed(1) + ' M';
  }

  if (value >= 1000000) {
    return 'Rp ' + (value / 1000000).toFixed(1) + ' jt';
  }

  if (value >= 1000) {
    return 'Rp ' + (value / 1000).toFixed(0) + ' rb';
  }

  return 'Rp ' + Math.round(value);

}


function setSummaryLoading(isLoading) {

  [
    'totalSaldo',
    'totalPemasukan',
    'totalPengeluaran'
  ].forEach(function(id) {
    document
      .getElementById(id)
      .classList.toggle(
        'summary-value-loading',
        isLoading
      );
  });

}


function setTransactionsLoading(isLoading) {

  if (!isLoading) {
    riwayatBody.classList.remove(
      'transaction-body-loading'
    );
    return;
  }

  riwayatBody.classList.add(
    'transaction-body-loading'
  );
  riwayatBody.innerHTML = Array.from(
    { length: 3 },
    function() {
      return `
        <tr class="skeleton-row" aria-hidden="true">
          <td><span></span></td>
          <td><span></span></td>
          <td><span></span></td>
          <td><span class="skeleton-badge"></span></td>
          <td><span></span></td>
          <td><span></span></td>
          <td><span></span></td>
          <td><span class="skeleton-action"></span></td>
        </tr>
      `;
    }
  ).join('');
  loadingRiwayat.style.display = 'none';

}


function renderTransactions(transaksi) {

  const bulan = filterBulan.value;
  const jenis = filterJenis.value;
  const filteredTransactions = transaksi.filter(function(item) {
    return (!bulan || item.bulan === bulan) &&
      (!jenis || item.jenis === jenis);
  });

  riwayatBody.innerHTML = '';
  setTransactionsLoading(false);

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

    if (!passwordKelola) {
      tampilkanErrorPopup('Silakan masuk ke area Kelola Data terlebih dahulu.');
      return;
    }

    const data = {

      action: 'tambah',
      password: passwordKelola,

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

document
  .getElementById('btnLaporan')
  .addEventListener('click', function() {
    showSection(sectionLaporan);
  renderFinancialReport();
  });

document
  .getElementById('btnKelolaData')
  .addEventListener('click', function() {
    showSection(sectionKelolaData);
    if (passwordKelola) {
      showManagementContent();
    }
  });

document
  .getElementById('formUnlock')
  .addEventListener('submit', async function(event) {
    event.preventDefault();

    const passwordInput = document.getElementById('editPassword');
    const accessError = document.getElementById('accessError');
    const btnUnlock = document.getElementById('btnUnlock');
    btnUnlock.disabled = true;
    accessError.hidden = true;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'verifikasiPassword',
          password: passwordInput.value
        })
      });
      const result = await bacaResponseJSON(response);

      if (!result.success) {
        throw new Error(result.message || 'Password tidak benar.');
      }

      passwordKelola = passwordInput.value;
      passwordInput.value = '';
      showManagementContent();
    } catch (error) {
      accessError.textContent = error.message || 'Gagal memverifikasi password.';
      accessError.hidden = false;
    } finally {
      btnUnlock.disabled = false;
    }
  });

document
  .getElementById('btnKunci')
  .addEventListener('click', function() {
    passwordKelola = '';
    document.getElementById('managementContent').hidden = true;
    document.getElementById('editGate').hidden = false;
    showSection(sectionLaporan);
  });

reportFilterBulan.addEventListener('change', function() {
  renderReportTransactions(transaksiRingkasan);
});

reportFilterJenis.addEventListener('change', function() {
  renderReportTransactions(transaksiRingkasan);
});

window.addEventListener('resize', function() {
  if (ringkasanDimuat) {
    drawMonthlyChart(getMonthlyReportData());
  }
});

function showSection(section) {
  sectionLaporan.hidden = section !== sectionLaporan;
  sectionKelolaData.hidden = section !== sectionKelolaData;

  document.getElementById('btnLaporan').classList.toggle(
    'is-active',
    section === sectionLaporan
  );
  document.getElementById('btnKelolaData').classList.toggle(
    'is-active',
    section === sectionKelolaData
  );
  document.getElementById('btnLaporan').setAttribute(
    'aria-pressed',
    String(section === sectionLaporan)
  );
  document.getElementById('btnKelolaData').setAttribute(
    'aria-pressed',
    String(section === sectionKelolaData)
  );
}

function showManagementContent() {
  document.getElementById('editGate').hidden = true;
  document.getElementById('managementContent').hidden = false;
}

function getMonthlyReportData() {
  const rekap = new Map();

  transaksiRingkasan.forEach(function(item) {
    if (!rekap.has(item.bulan)) {
      rekap.set(item.bulan, {
        pemasukan: 0,
        pengeluaran: 0
      });
    }
    const nominal = Number(
      String(item.nominal ?? '').replace(/[^\d]/g, '')
    ) || 0;
    const total = rekap.get(item.bulan);
    if (item.jenis === 'Pemasukan') {
      total.pemasukan += nominal;
    } else if (item.jenis === 'Pengeluaran') {
      total.pengeluaran += nominal;
    }
  });

  return (daftarBulan.length ? daftarBulan : Array.from(rekap.keys()))
    .map(function(bulan) {
      const total = rekap.get(bulan) || {
        pemasukan: 0,
        pengeluaran: 0
      };
      return {
        bulan: bulan,
        pemasukan: total.pemasukan,
        pengeluaran: total.pengeluaran,
        saldo: total.pemasukan - total.pengeluaran
      };
    });
}


/* =========================================
   FORMAT RUPIAH
========================================= */

function formatRupiah(value) {

  const text =
    String(value ?? '')
      .trim();

  const angka =
    Number(
      text
        .replace(/[^\d]/g, '')
    );
  const nominal =
    text.startsWith('-')
      ? -angka
      : angka;


  return nominal.toLocaleString(
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

    if (!passwordKelola) {
      tampilkanErrorPopup('Silakan masuk ke area Kelola Data terlebih dahulu.');
      return;
    }

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
                  password: passwordKelola,

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