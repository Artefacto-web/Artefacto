// Loading screen
window.addEventListener("load", () => {
  const loadingScreen = document.getElementById("loading-screen")
  setTimeout(() => {
    loadingScreen.classList.add("fade-out")
    setTimeout(() => {
      loadingScreen.style.display = "none"
    }, 500)
  }, 1500) // Show loading for 1.5 seconds minimum
})

// Import PDF.js library
const pdfjsLib = window["pdfjs-dist/build/pdf"]

// Magazine editions configuration
const editions = [
  {
    title: "Junio 2025 - Vol. 1, Nº 1",
    filename: "magazines/2025-06-vol1-n1.pdf",
    description: "Primera edición de Artefacto",
    date: "2025-06",
    volume: 1,
    number: 1,
  },
  // Agregar más ediciones aquí siguiendo el mismo formato
  // {
  //   title: "Julio 2025 - Vol. 1, Nº 2",
  //   filename: "magazines/2025-07-vol1-n2.pdf",
  //   description: "Segunda edición de Artefacto",
  //   date: "2025-07",
  //   volume: 1,
  //   number: 2
  // }
]

// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

// Global variables for PDF viewer
let pdfDoc = null
let pageNum = 1
let pageRendering = false
let pageNumPending = null
let scale = 1.2
const canvas = document.getElementById("pdf-canvas")
const ctx = canvas.getContext("2d")

// Initialize the website
document.addEventListener("DOMContentLoaded", () => {
  initializeEditions()
  setupNavigation()
  setupContactForm()
  initScrollAnimations()
})

// Función para detectar automáticamente PDFs (simulada)
function detectMagazines() {
  // En un entorno real, esto haría una petición al servidor
  // para obtener la lista de archivos en magazines/
  return editions
}

// Actualizar la función de inicialización
function initializeEditions() {
  const detectedEditions = detectMagazines()
  const currentEdition = detectedEditions[detectedEditions.length - 1]

  // Actualizar información de edición actual
  if (document.getElementById("current-title")) {
    document.getElementById("current-title").textContent = currentEdition.title
  }
  if (document.getElementById("download-link")) {
    document.getElementById("download-link").href = currentEdition.filename
  }

  // Actualizar lista de ediciones en footer
  const editionsList = document.getElementById("editions-list")
  if (editionsList) {
    editionsList.innerHTML = ""
    detectedEditions.forEach((edition) => {
      const link = document.createElement("a")
      link.href = edition.filename
      link.textContent = edition.title
      link.style.display = "block"
      link.style.color = "var(--light-blue)"
      link.style.textDecoration = "none"
      link.style.marginBottom = "5px"
      link.download = true
      editionsList.appendChild(link)
    })
  }
}

// Setup navigation
function setupNavigation() {
  const hamburger = document.querySelector(".hamburger")
  const navMenu = document.querySelector(".nav-menu")
  const navLinks = document.querySelectorAll(".nav-link")

  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active")
    navMenu.classList.toggle("active")
  })

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active")
      navMenu.classList.toggle("active")
    })
  })

  // Smooth scrolling solo para enlaces internos (que empiecen con #)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href")
      if (href.startsWith("#")) {
        e.preventDefault()
        const targetSection = document.querySelector(href)
        if (targetSection) {
          const offsetTop = targetSection.offsetTop - 80
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          })
        }
      }
    })
  })

  // Add scroll effect to navbar
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar")
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(30, 58, 138, 0.98)"
      navbar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"
    } else {
      navbar.style.background = "var(--primary-blue)"
      navbar.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"
    }
  })
}

// Setup contact form
function setupContactForm() {
  const form = document.getElementById("contact-form")
  if (!form) return

  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const formData = new FormData(form)
    const name = formData.get("name")
    const email = formData.get("email")
    const subject = formData.get("subject")
    const message = formData.get("message")

    // Get subject text
    const subjectSelect = document.getElementById("subject")
    const subjectText = subjectSelect.options[subjectSelect.selectedIndex].text

    // Create mailto link
    const mailtoLink = `mailto:dm.artefacto@gmail.com?subject=${encodeURIComponent(`[Artefacto] ${subjectText} - ${name}`)}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`)}`

    // Open mailto link
    window.location.href = mailtoLink

    // Show success message
    alert(
      "Se abrirá tu cliente de correo para enviar el mensaje. Si no se abre automáticamente, puedes escribir directamente a dm.artefacto@gmail.com",
    )

    // Reset form
    form.reset()
  })
}

// PDF Viewer Functions
function openPDFViewer() {
  const currentEdition = editions[editions.length - 1]
  document.getElementById("pdf-title").textContent = `Artefacto - ${currentEdition.title}`
  document.getElementById("pdf-modal").style.display = "block"
  loadPDF(currentEdition.filename)
}

function closePDFViewer() {
  document.getElementById("pdf-modal").style.display = "none"
  if (pdfDoc) {
    pdfDoc = null
    pageNum = 1
  }
}

function loadPDF(url) {
  const loadingMessage = document.getElementById("pdf-loading-message")
  if (loadingMessage) {
    loadingMessage.style.display = "block"
  }

  pdfjsLib
    .getDocument(url)
    .promise.then((pdfDoc_) => {
      pdfDoc = pdfDoc_
      document.getElementById("page-info").textContent = `Página ${pageNum} de ${pdfDoc.numPages}`

      // Hide loading message
      if (loadingMessage) {
        loadingMessage.style.display = "none"
      }

      // Initial page render
      renderPage(pageNum)

      // Update navigation buttons
      updateNavigationButtons()
    })
    .catch((error) => {
      console.error("Error loading PDF:", error)
      if (loadingMessage) {
        loadingMessage.style.display = "none"
      }
      alert("Error al cargar el PDF. Por favor, intenta nuevamente.")
    })
}

function renderPage(num) {
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
        renderPage(pageNumPending)
        pageNumPending = null
      }
    })
  })

  document.getElementById("page-info").textContent = `Página ${num} de ${pdfDoc.numPages}`
  updateNavigationButtons()
}

function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num
  } else {
    renderPage(num)
  }
}

function previousPage() {
  if (pageNum <= 1) {
    return
  }
  pageNum--
  queueRenderPage(pageNum)
}

function nextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return
  }
  pageNum++
  queueRenderPage(pageNum)
}

function updateNavigationButtons() {
  document.getElementById("prev-btn").disabled = pageNum <= 1
  document.getElementById("next-btn").disabled = pageNum >= pdfDoc.numPages
}

function zoomIn() {
  scale += 0.2
  document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%"
  queueRenderPage(pageNum)
}

function zoomOut() {
  if (scale > 0.4) {
    scale -= 0.2
    document.getElementById("zoom-level").textContent = Math.round(scale * 100) + "%"
    queueRenderPage(pageNum)
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
  if (modal.style.display === "block") {
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

// Add scroll animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe all animated elements
  document.querySelectorAll(".feature, .editor-card, .guideline-card").forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "all 0.8s ease"
    observer.observe(el)
  })
}
