// Editions loader for automatic detection of PDF files
class EditionsLoader {
  constructor() {
    this.editions = []
    this.loadingElement = document.getElementById("loading-editions")
    this.gridElement = document.getElementById("editions-grid")
    this.noEditionsElement = document.getElementById("no-editions")

    // PDF.js configuration
    window.pdfjsLib = window["pdfjs-dist/build/pdf"]
    if (typeof window.pdfjsLib !== "undefined") {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
    }

    // PDF viewer variables
    this.pdfDoc = null
    this.pageNum = 1
    this.pageRendering = false
    this.pageNumPending = null
    this.scale = 1.2
    this.canvas = null
    this.ctx = null
  }

  async loadEditions() {
    try {
      // Simulate loading time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Define editions directly here to avoid dependency issues
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
    if (this.loadingElement) {
      this.loadingElement.style.display = "none"
    }

    if (this.editions.length === 0) {
      this.showNoEditions()
      return
    }

    if (this.gridElement) {
      this.gridElement.style.display = "grid"
      this.gridElement.innerHTML = ""

      // Sort editions by date (newest first)
      const sortedEditions = this.editions.sort((a, b) => new Date(b.date) - new Date(a.date))

      sortedEditions.forEach((edition, index) => {
        const editionCard = this.createEditionCard(edition, index === 0)
        this.gridElement.appendChild(editionCard)
      })
    }
  }

  createEditionCard(edition, isLatest = false) {
    const card = document.createElement("div")
    card.className = "edition-card"
    if (isLatest) card.classList.add("latest-edition")

    // Create unique function names to avoid conflicts
    const viewFunctionName = `viewEdition_${edition.volume}_${edition.number}`

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
          <button class="btn-primary btn-small" onclick="editionsLoader.openPDF('${edition.filename}', '${edition.title}')">
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
    if (this.loadingElement) {
      this.loadingElement.style.display = "none"
    }
    if (this.noEditionsElement) {
      this.noEditionsElement.style.display = "block"
    }
  }

  // PDF Functions
  openPDF(filename, title) {
    const modal = document.getElementById("pdf-modal")
    const titleElement = document.getElementById("pdf-title")

    if (titleElement) {
      titleElement.textContent = `Artefacto - ${title}`
    }
    if (modal) {
      modal.style.display = "block"
    }

    // Initialize canvas if not already done
    if (!this.canvas) {
      this.canvas = document.getElementById("pdf-canvas")
      if (this.canvas) {
        this.ctx = this.canvas.getContext("2d")
      }
    }

    this.loadPDF(filename)
  }

  loadPDF(url) {
    const loadingMessage = document.getElementById("pdf-loading-message")
    if (loadingMessage) {
      loadingMessage.style.display = "block"
    }

    if (typeof window.pdfjsLib === "undefined") {
      console.error("PDF.js not loaded")
      if (loadingMessage) {
        loadingMessage.style.display = "none"
      }
      alert("Error: PDF.js no está cargado correctamente.")
      return
    }

    window.pdfjsLib
      .getDocument(url)
      .promise.then((pdfDoc_) => {
        this.pdfDoc = pdfDoc_
        this.pageNum = 1 // Reset to first page

        const pageInfo = document.getElementById("page-info")
        if (pageInfo) {
          pageInfo.textContent = `Página ${this.pageNum} de ${this.pdfDoc.numPages}`
        }

        // Hide loading message
        if (loadingMessage) {
          loadingMessage.style.display = "none"
        }

        // Initial page render
        this.renderPage(this.pageNum)

        // Update navigation buttons
        this.updateNavigationButtons()
      })
      .catch((error) => {
        console.error("Error loading PDF:", error)
        if (loadingMessage) {
          loadingMessage.style.display = "none"
        }
        alert("Error al cargar el PDF. Por favor, intenta nuevamente.")
      })
  }

  renderPage(num) {
    if (!this.canvas || !this.ctx || !this.pdfDoc) return

    this.pageRendering = true

    this.pdfDoc.getPage(num).then((page) => {
      const viewport = page.getViewport({ scale: this.scale })
      this.canvas.height = viewport.height
      this.canvas.width = viewport.width

      const renderContext = {
        canvasContext: this.ctx,
        viewport: viewport,
      }

      const renderTask = page.render(renderContext)

      renderTask.promise.then(() => {
        this.pageRendering = false
        if (this.pageNumPending !== null) {
          this.renderPage(this.pageNumPending)
          this.pageNumPending = null
        }
      })
    })

    const pageInfo = document.getElementById("page-info")
    if (pageInfo) {
      pageInfo.textContent = `Página ${num} de ${this.pdfDoc.numPages}`
    }
    this.updateNavigationButtons()
  }

  queueRenderPage(num) {
    if (this.pageRendering) {
      this.pageNumPending = num
    } else {
      this.renderPage(num)
    }
  }

  previousPage() {
    if (this.pageNum <= 1) {
      return
    }
    this.pageNum--
    this.queueRenderPage(this.pageNum)
  }

  nextPage() {
    if (!this.pdfDoc || this.pageNum >= this.pdfDoc.numPages) {
      return
    }
    this.pageNum++
    this.queueRenderPage(this.pageNum)
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById("prev-btn")
    const nextBtn = document.getElementById("next-btn")
    if (prevBtn) prevBtn.disabled = this.pageNum <= 1
    if (nextBtn && this.pdfDoc) nextBtn.disabled = this.pageNum >= this.pdfDoc.numPages
  }

  zoomIn() {
    this.scale += 0.2
    const zoomLevel = document.getElementById("zoom-level")
    if (zoomLevel) {
      zoomLevel.textContent = Math.round(this.scale * 100) + "%"
    }
    this.queueRenderPage(this.pageNum)
  }

  zoomOut() {
    if (this.scale > 0.4) {
      this.scale -= 0.2
      const zoomLevel = document.getElementById("zoom-level")
      if (zoomLevel) {
        zoomLevel.textContent = Math.round(this.scale * 100) + "%"
      }
      this.queueRenderPage(this.pageNum)
    }
  }

  closePDF() {
    const modal = document.getElementById("pdf-modal")
    if (modal) {
      modal.style.display = "none"
    }
    if (this.pdfDoc) {
      this.pdfDoc = null
      this.pageNum = 1
    }
  }
}

// Global instance
let editionsLoader = null

// Initialize editions loader when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  editionsLoader = new EditionsLoader()
  editionsLoader.loadEditions()
})

// Global functions for PDF controls
function previousPage() {
  if (editionsLoader) {
    editionsLoader.previousPage()
  }
}

function nextPage() {
  if (editionsLoader) {
    editionsLoader.nextPage()
  }
}

function zoomIn() {
  if (editionsLoader) {
    editionsLoader.zoomIn()
  }
}

function zoomOut() {
  if (editionsLoader) {
    editionsLoader.zoomOut()
  }
}

function closePDFViewer() {
  if (editionsLoader) {
    editionsLoader.closePDF()
  }
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  const modal = document.getElementById("pdf-modal")
  if (event.target === modal && editionsLoader) {
    editionsLoader.closePDF()
  }
})

// Keyboard navigation for PDF
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("pdf-modal")
  if (modal && modal.style.display === "block" && editionsLoader) {
    switch (e.key) {
      case "ArrowLeft":
        editionsLoader.previousPage()
        break
      case "ArrowRight":
        editionsLoader.nextPage()
        break
      case "Escape":
        editionsLoader.closePDF()
        break
      case "+":
        editionsLoader.zoomIn()
        break
      case "-":
        editionsLoader.zoomOut()
        break
    }
  }
})
