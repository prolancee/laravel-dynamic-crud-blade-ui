/**
 * -------------------------------------------------------------
 *  MESSAGE SWEETALERT2 HANDLER (AUTO DEFAULT OR CUSTOM MESSAGE)
 * -------------------------------------------------------------
 */
export const responsor_sweetalert2 = (() => {

    const messages = {
        success: {
            store: "Successfully Stored!",
            update: "Successfully Updated!",
            delete: "Successfully Deleted!",
            upload: "File Uploaded Successfully!"
        },
        error: {
            store: "Store Failed!",
            update: "Update Failed!",
            delete: "Delete Failed!",
            upload: "Upload Failed!"
        },
        info: {
            store: "Store Information",
            update: "Update Information",
            delete: "Delete Information"
        },
        warn: {
            store: "Warning: Check before proceeding.",
            update: "Update Warning!",
            delete: "Delete Warning!"
        }
    };

    const notify = (type = "info", message = "") => {
        const finalMessage =
            messages[type]?.[message] // Default message found?
            || message                // Otherwise treat as custom message
            || "Done!";               // Agar empty ho to fallback message          

        Swal?.fire({
            title: type.toUpperCase(),
            text: finalMessage,
            icon: type
        });
    };

    const confirm = async ({
        title = "Are you sure?",
        text = "This action cannot be undone!",
        icon = "warning",
        confirmText = "Confirm",
        cancelText = "Cancel"
    } = {}) => {
        const result = await Swal?.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            reverseButtons: true
        });

        return result.isConfirmed;
    };

    return {
        success(msg) { notify("success", msg); },
        error(msg) { notify("error", msg); },
        info(msg) { notify("info", msg); },
        warn(msg) { notify("warn", msg); },
        
        upload: {
            size(msg = "File too large.") {
                Swal?.fire({ icon: "info", text: msg });
            },
            type(msg = "Unsupported file type.") {
                Swal?.fire({ icon: "info", text: msg });
            }
        },

        confirm
    };

})();
