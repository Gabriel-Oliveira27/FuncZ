// Updated tax display logic in the generatePosterHTML function
// Changes made to ensure that "Sem juros" is only displayed when semTaxaNx is true.
const generatePosterHTML = () => {
    // ... your existing code

    if (product.juros && !semTaxaNx) {
        taxaTexto = `${taxRate.mensal}% a.m e ${taxRate.anual}% a.a`;
    } else {
        taxaTexto = "Sem juros";
    }

    //... rest of your logic
}