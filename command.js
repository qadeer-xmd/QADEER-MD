/**
 * QADEER-MD Command Handler
 * Developed By: Qadeer Brahvi
 */

const commands = [];

/**
 * Register a new command
 * @param {Object} info - Command Information
 * @param {Function} func - Function to execute
 */
function cmd(info, func) {
    let data = { ...info };

    // Defaults set karna
    data.function = func || function () {};
    data.dontAddCommandList = data.dontAddCommandList || false;
    data.desc = data.desc || "No description added";
    data.fromMe = data.fromMe || false;
    data.category = data.category || "General";
    data.filename = data.filename || "Not Provided";

    // Command list me push karna
    commands.push(data);
    return data;
}

module.exports = {
    cmd,              // main function
    AddCommand: cmd,  // alternate alias
    Function: cmd,    // alternate alias
    Module: cmd,      // alternate alias
    commands          // list of all registered commands
};
