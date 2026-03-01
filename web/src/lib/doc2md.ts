export async function doc2md(file: Buffer<ArrayBuffer>): Promise<{ success: boolean; markdown?: string }> {
    const form = new FormData();
    form.append('file', new Blob([file]), 'upload');
    try {
        const res = await fetch('http://localhost:8000/doc2md', {
            method: 'POST',
            body: form,
        });
        if (res.ok) {
            const data = await res.json();
            return data;
        } else {
            console.error('Doc2MD API error:', res.statusText);
            return { success: false };
        }
    } catch (error) {
        console.error('Error calling Doc2MD API:', error);
        return { success: false };
    }
}