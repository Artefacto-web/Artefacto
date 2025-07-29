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

// Function to open PDF from editions page
function openPDFFromEditions(filename, title) {
  document.getElementById("pdf-title").textContent = `Artefacto - ${title}`
  document.getElementById("pdf-modal").style.display = "block"
  window.loadPDF(filename) // Assuming loadPDF is a global function
}

// Declare the loadPDF function if it's not already defined
function loadPDF(filename) {
  // Implementation to load PDF goes here
  console.log(`Loading PDF: ${filename}`)
}
