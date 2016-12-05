import * as d3 from '../d3';

export interface CheckboxMultiselect {
    update(text?: string): void;
}

export function CheckboxMultiselect(originalElement: HTMLSelectElement, text?: string) : CheckboxMultiselect {
    let originalSelect = d3.select(originalElement),
        displaySelect: d3.DatalessSelection;
        
    let displayElement = document.createElement('select');
    let displayOption = document.createElement('option');
    
    let originalOptions = originalSelect.selectAll('option.choice') as d3.Selection<HTMLOptionElement, {}, Element, {}>;

    // First hide the select element
    originalSelect
        .style('visibility', 'hidden')
        .style('position', 'absolute');

    // Insert the display <select> element right after it 
    originalElement.parentElement.insertAdjacentElement('beforeend', displayElement);
    displaySelect = d3.select(displayElement);

    // Create a single option
    displayOption.text = text;
    displayElement.add(displayOption);

    // Create the checkbox display
    let checkboxHasFocus = false;
    let checkboxesContainer = document.createElement('div');
    originalElement.parentElement.insertAdjacentElement('beforeend', checkboxesContainer);
    let checkboxesContainerSelect = d3.select(checkboxesContainer)
        .attr('class', 'checkbox-multiselect')
        .style('min-width', displayElement.clientWidth + 'px')
        .on('mousedown', function() {
            checkboxHasFocus = true;  
        });

    let checkboxes = checkboxesContainerSelect
      .selectAll('input')
        .data(originalOptions.nodes());

    let checkboxesEnter = checkboxes.enter();
    checkboxesEnter
      .append('label')
        .attr('for', d => d.text)
        .text(d => d.text)
        .style('display', 'block')
        .on('mousedown', function() {
            checkboxHasFocus = true;
        })
      .append('input')
        .attr('type', 'checkbox')
        .attr('id', d => d.text)
        .attr('value', d => d.text)
        .style('float', 'left')
        .on('change', function(d) {
            d.selected = (<HTMLInputElement>this).checked;
            d.parentElement.dispatchEvent(new Event('change'));
        })
        .on('focus', function() {
            checkboxHasFocus = true;
        })
        .on('blur', function() {
            checkboxHasFocus = false;
        });
      
    // Prevent the display element from showing the default menu
    displayElement.addEventListener('mousedown', function(event) {
        event.preventDefault();
        displayElement.focus();
    });

    displayElement.addEventListener('focus', function(event) {
        if (checkboxesContainerSelect.style('display') === 'none') {
            checkboxesContainerSelect.style('display', 'block');
        }
    });

    displayElement.addEventListener('blur', function(event) {
        setTimeout(() => {
            if (checkboxHasFocus) {
                this.focus();
            }
            else {
                checkboxesContainerSelect.style('display', 'none');
                window.focus();
            }
        }, 33);
    });

    return <CheckboxMultiselect>{
        update: function(text?: string) {
            // Update the displayed text
            displayOption.text = text;

            // Update the checkboxes based on the selected options
            checkboxesContainerSelect
              .selectAll('input')
                .data(originalOptions.nodes())
                .property('checked', d => d.selected);
        }
    };
}