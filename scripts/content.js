const selectOptionFromName = (select, name) => {
    const options = select.getElementsByTagName('option');
    for(let i = 0; i < options.length; i ++) {
        if(name === options[i].innerHTML) {
            return i - 1;
        }
    }
    return -1;
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    document.getElementById(message.notice).dispatchEvent(new Event('click'));
    // Check if there is an opened popup window
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    popupWindow = window.open("about:blank", "MsgWindow", "location=no,menubar=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,top=0,left=0");
    popupWindow.resizeTo(width * 0.8, height * 0.8);
    popupWindow.moveTo(width * 0.1, height * 0.1);
});

const getDownloadCompany = async () => {
    const { savedCompanies } = await chrome.storage.local.get('savedCompanies');
    if(!savedCompanies) return null;
    return savedCompanies.find(c => c.down === true);
}

function updateObjectByName(array, name, updatedProperties) {
    const index = array.findIndex(obj => obj.name === name);
    if (index !== -1) {
        // Update the object's properties
        array[index] = { ...array[index], ...updatedProperties };
    }
}

const loadSearchResult = async () => {
    const currentUrl = window.location.href;
    const downCompany = await getDownloadCompany();

    if(currentUrl === 'https://www.handelsregister.de/rp_web/ergebnisse.xhtml') {
        if(downCompany) {
            let downIndex = -1;
            if(downCompany.AD) {
                downIndex = 0;
            } else if(downCompany.CD) {
                downIndex = 1;
            } else if(downCompany.SI) {
                downIndex = 6;
            }
            const { savedCompanies } = await chrome.storage.local.get('savedCompanies');
            if(downIndex != -1) {
                const table = document.getElementById('ergebnissForm:selectedSuchErgebnisFormTable_data');
                const subTable = table.rows[0].cells[0].getElementsByTagName('table')[0].getElementsByTagName('tbody')[0];
                const links = subTable.rows[1].cells[3].getElementsByTagName('span');
                try {
                    links[downIndex].parentNode.click();
                } catch {}
                const names = ["AD", "CD", "HD", "DK", "UT", "VO", "SI"];
                updateObjectByName(savedCompanies, downCompany.name, {[names[downIndex]]: false});
            } else {
                updateObjectByName(savedCompanies, downCompany.name, {down: false});
            }
            chrome.storage.local.set({savedCompanies});
            chrome.storage.local.set({searchCompanies: null});
        } else {
            try {
                const getSpanText = (table, r, c) => table.rows[r].cells[c].getElementsByTagName('span')[0].innerHTML;
                const table = document.getElementById('ergebnissForm:selectedSuchErgebnisFormTable_data');
                const searchCompanies = [];
                for (let r = 0, n = table.rows.length; r < n; r++) {
                    const subTable = table.rows[r].cells[0].getElementsByTagName('table')[0].getElementsByTagName('tbody')[0];
                    const name = getSpanText(subTable, 1, 0).replace(/&amp;/g, '&').replace(/&quot;/g, '"');
                    searchCompanies.push({
                        name,
                        AD: false,
                        CD: false,
                        HD: false,
                        DK: false,
                        UT: false,
                        VO: false,
                        SI: false,
                        down: false
                    })
                }
                chrome.storage.local.set({searchCompanies});
                chrome.runtime.sendMessage({search: true});
            } catch {}
        }

    } else if(currentUrl === 'https://www.handelsregister.de/rp_web/normalesuche.xhtml') {
        options = document.getElementsByName('form:schlagwortOptionen');    
        if(downCompany) {
            document.getElementById('form:schlagwoerter').value = downCompany.name;    
            options[1].checked = '';
            options[2].checked = 'checked';
            document.getElementById('form:btnSuche').click();
        } else {
            options[1].checked = 'checked';
            options[2].checked = '';
        }
    } else if(currentUrl === 'https://www.handelsregister.de/rp_web/chargeinfo.xhtml') {
        if(downCompany) {
            try {
                document.getElementById('form:kostenpflichtigabrufen').click();
            } catch {
                window.location.href = "https://www.handelsregister.de/rp_web/ergebnisse.xhtml";
            }
        }
    }
}

loadSearchResult();