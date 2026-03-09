import * as pdfjsLib from 'pdfjs-dist';

// Use a public CDN for the worker to avoid Vite build issues with worker files
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const generatePdfCover = async (pdfUrl: string): Promise<string | null> => {
    try {
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        // Fetch the first page
        const page = await pdf.getPage(1);

        // Set scale to get a decent resolution cover image
        const viewport = page.getViewport({ scale: 1.5 });

        // Prepare canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) return null;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Return base64 URL
        return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
        console.error('Error generating PDF cover:', error);
        return null;
    }
};
