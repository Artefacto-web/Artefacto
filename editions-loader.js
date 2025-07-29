// Editions loader for automatic detection of PDF files
class EditionsLoader {
  constructor() {
    this.editions = []
    this.loadingElement = document.getElementById("loading-editions")
    this.gridElement = document.getElementById("editions-grid")
    this.noEditionsElement = document.getElementById("no-editions")
  }

  async loadEditions() {
    try {
      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // For now, we'll use the predefined editions from script.js
      // In a real implementation, you would scan the magazines/ directory
      this.editions = [
        {
          title: "Junio 2025 - Vol. 1, Nº 1",
          filename: "magazines/2025-06-vol1-n1.pdf",
          description: "Primera edición de Artefacto",
          date: "2025-06",
          volume: 1,
          number: 1,
          coverImage: "assets/portada1.jpg",
        },
        // Add more editions here as they become available
      ]

      this.displayEditions()
    } catch (error) {
      console.error("Error loading editions:", error)
      this.showNoEditions()
    }
  }

  displayEditions() {
    this.loadingElement.style.display = "none"

    if (this.editions.length === 0) {
      this.showNoEditions()
      return
    }

    this.gridElement.style.display = "grid"
    this.gridElement.innerHTML = ""

    // Sort editions by date (newest first)
    const sortedEditions = this.editions.sort((a, b) => new Date(b.date) - new Date(a.date))

    sortedEditions.forEach((edition, index) => {
      const editionCard = this.createEditionCard(edition, index === 0)
      this.gridElement.appendChild(editionCard)
    })
  }

  createEditionCard(edition, isLatest = false) {
    const card = document.createElement("div")
    card.className = "edition-card"
    if (isLatest) card.classList.add("latest-edition")

    card.innerHTML = `
      <div class="edition-cover">
        <img src="${edition.coverImage}" alt="Portada ${edition.title}" class="cover-image">
        ${isLatest ? '<div class="latest-badge">Más Reciente</div>' : ""}
      </div>
      <div class="edition-info">
        <h3>${edition.title}</h3>
        <p class="edition-description">${edition.description}</p>
        <div class="edition-meta">
          <span class="edition-date">${this.formatDate(edition.date)}</span>
          <span class="edition-volume">Vol. ${edition.volume}, Nº ${edition.number}</span>
        </div>
        <div class="edition-actions">
          <button class="btn-primary btn-small" onclick="openPDFFromEditions('${edition.filename}', '${edition.title}')">
            👁️ Ver Revista
          </button>
          <a href="${edition.filename}" class="btn-secondary btn-small" download>
            📥 Descargar
          </a>
        </div>
      </div>
    `

    // Add animation delay
    card.style.animationDelay = `${this.editions.indexOf(edition) * 0.1}s`

    return card
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    })
  }

  showNoEditions() {
    this.loadingElement.style.display = "none"
    this.noEditionsElement.style.display = "block"
  }
}

// Initialize editions loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const loader = new EditionsLoader()
  loader.loadEditions()
})

// PDF.js configuration for editions page
const pdfjsLib = window["pdfjs-dist/build/pdf"]
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

// Global variables for PDF viewer
let pdfDoc = null
let pageNum = 1
let pageRendering = false
let pageNumPending = null
let scale = 1.2
let canvas = null
let ctx = null

// Function to open PDF from editions page
function openPDFFromEditions(filename, title) {
  document.getElementById("pdf-title").textContent = `Artefacto - ${title}`
  document.getElementById("pdf-modal").style.display = "block"

  // Initialize canvas if not already done
  if (!canvas) {
    canvas = document.getElementById("pdf-canvas")
    ctx = canvas.getContext("2d")
  }

  loadPDFFromEditions(filename)
}

// Load PDF function for editions page
function loadPDFFromEditions(url) {
  const loadingMessage = document.getElementById("pdf-loading-message")
  if (loadingMessage) {
    loadingMessage.style.display = "block"
  }

  pdfjsLib
    .getDocument(url)
    .promise.then((pdfDoc_) => {
      pdfDoc = pdfDoc_
      pageNum = 1 // Reset to first page
      document.getElementById("page-info").textContent = `Página ${pageNum} de ${pdfDoc.numPages}`

      // Hide loading message
      if (loadingMessage) {
        loadingMessage.style.display = "none"
      }

      // Initial page render
      renderPageFromEditions(pageNum)

      // Update navigation buttons
      updateNavigationButtonsFromEditions()
    })
    .catch((error) => {
      console.error("Error loading PDF:", error)
      if (loadingMessage) {
        loadingMessage.style.display = "none"
      }
      alert("Error al cargar el PDF. Por favor, intenta nuevamente.")
    })
}

function renderPageFromEditions(num) {
  pageRendering = true

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale: scale })
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    }

    const renderTask = page.render(renderContext)

    renderTask.promise.then(() => {
      pageRendering = false
      if (pageNumPending !== null) {
        renderPageFromEditions(pageNumPending)
        pageNumPending = null
      }
    })
  })

  document.getElementById("page-info").textContent = `Página ${num} de ${pdfDoc.numPages}`
  updateNavigationButtonsFromEditions()
}

function queueRenderPageFromEditions(num) {
  if (pageRendering) {
    pageNumPending = num
  } else {
    renderPageFromEditions(num)
  }
}

function previousPage() {
  if (pageNum <= 1) {
    return
  }
  pageNum--
  queueRenderPageFromEditions(pageNum)
}

function nextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return
  }
  pageNum++
  queueRenderPageFromEditions(pageNum)
}

function updateNavigationButtonsFromEditions() {
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")
  if (prevBtn) prevBtn.disabled = pageNum <= 1
  if (nextBtn) nextBtn.disabled = pageNum >= pdfDoc.numPages
}

function zoomIn() {
  scale += 0.2
  document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%"
  queueRenderPageFromEditions(pageNum)
}

function zoomOut() {
  if (scale > 0.4) {
    scale -= 0.2
    document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%"
    queueRenderPageFromEditions(pageNum)
  }
}

function closePDFViewer() {
  document.getElementById("pdf-modal").style.display = "none"
  if (pdfDoc) {
    pdfDoc = null
    pageNum = 1
  }
}

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("pdf-modal")
  if (event.target === modal) {
    closePDFViewer()
  }
}

// Keyboard navigation for PDF
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("pdf-modal")
  if (modal && modal.style.display === "block") {
    switch (e.key) {
      case "ArrowLeft":
        previousPage()
        break
      case "ArrowRight":
        nextPage()
        break
      case "Escape":
        closePDFViewer()
        break
      case "+":
        zoomIn()
        break
      case "-":
        zoomOut()
        break
    }
  }
})
