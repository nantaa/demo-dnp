import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export const MySwal = withReactContent(Swal);

export const showSuccess = (title, text = '') => {
    return MySwal.fire({
        icon: 'success',
        title: title,
        text: text,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
    });
};

export const showError = (title, text = '') => {
    return MySwal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonColor: '#d33',
    });
};

export const showWarning = (title, text = '') => {
    return MySwal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonColor: '#f59e0b',
    });
};

export const showConfirm = (title, text = '', confirmText = 'Ya', cancelText = 'Batal') => {
    return MySwal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
    });
};

export const handleInertiaError = (errors) => {
    if (!errors) return;
    
    // If it's a string, just show it
    if (typeof errors === 'string') {
        showError('Oops...', errors);
        return;
    }
    
    // If it's an object (like Laravel validation errors)
    if (typeof errors === 'object') {
        const errorMessages = Object.values(errors).flat();
        if (errorMessages.length > 0) {
            showError('Validasi Gagal', errorMessages.join('\n'));
        } else {
            showError('Terjadi Kesalahan', 'Silakan coba lagi.');
        }
    }
};
