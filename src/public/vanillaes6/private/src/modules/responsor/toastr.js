/**
 * -------------------------------------------------------------
 *  MESSAGE TOASTR HANDLER (AUTO DEFAULT OR CUSTOM MESSAGE)
 * -------------------------------------------------------------
 */
export const responsor_toastr = (() => {

    const messages = {
        success: {
            store: "Successfully Stored!",
            update: "Successfully Updated!",
            delete: "Successfully Deleted!",
            upload: "Successfully Uploaded!"
        },
        info: {
            store: "Store Info",
            update: "Update Info",
            delete: "Delete Info",
        },
        warn: {
            store: "Store Warning",
            update: "Update Warning",
            delete: "Delete Warning"
        },
        error: {
            store: "Store Error",
            update: "Update Error",
            delete: "Delete Error",
            upload: "Upload Error"
        }
    };

    const show = (type, key) => {
        const finalMessage =
            messages[type]?.[key]   // Default mapped message?
            || key                  // Otherwise consider key as message
            || "Done!";             // Fallback when empty

        toastr?.[type](finalMessage);
    };

    return {
        success(key) { show("success", key); },
        info(key) { show("info", key); },
        warn(key) { show("warning", key); },
        error(key) { show("error", key); },

        upload: {
            size(msg = "File too large.") { toastr?.info(msg); },
            type(msg = "Unsupported file type.") { toastr?.info(msg); }
        }
    };

})();
