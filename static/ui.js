
// Global variable for counting charts; used
// to give each chart a unique ID in the document:
var charts = 0;

// A selection of genomic keys that a user can
// filter on:
var genomicFields =
    [
        'id',
        'locus.landmark',
        'locus.strand',
        'reference.sequence'
    ];

// Populates <select> form element with the
// contents of genomicFields:
function populateSelect(field)
{
    $.each(genomicFields,
           function(index, name)
           {
               $(field).append($('<option></option>').attr('value', name).text(name));
           });
}

// Setup <select> field; permits user to pick
// a key that he/she wants to filter on:
populateSelect('#field1');

// Set default values for query limits (max. result
// returned) and offset (how many results to skip):
$('#limit').val('10');
$('#offset').val('0');

// Plots sample stats -- how many samples have data:
function plotSampleStats(container, el)
{
    var chartId = 'chart' + charts++;
    var chartDiv = $('<div id="' + chartId + '" class="bar"></div>');
    el.append(chartDiv);

    var withData = 0;
    var withoutData = 0;

    for (key in container)
    {
        if (container.hasOwnProperty(key))
        {
            if (container[key] == null)
            {
                withoutData++;
            }
            else
            {
                withData++;
            }
        }
    }

    var chart = c3.generate({
                                bindto: '#' + chartId,
                                data:
                                    {
                                        type: 'gauge',
                                        columns:
                                            [
                                                [ 'with data', (withData / (withData + withoutData)) * 100 ]
                                            ]
                                    },
                                axis:
                                    {
                                        rotated: true
                                    },
                                tooltip:
                                    {
                                        show: false
                                    }
                            });

    return chartDiv;
}

// Plots genotype likelihoods (Phred scaled) for bi-allelic sites:
function plotLikelihood(container, el)
{
    var chartId = 'chart' + charts++;
    var chartDiv = $('<div id="' + chartId + '" class="donut"></div>');
    el.append(chartDiv);

    var columns = [];

    columns.push([ 'AA', container['AA']['genotype-likelihood-phred-scaled'] ]);
    columns.push([ 'AB', container['AB']['genotype-likelihood-phred-scaled'] ]);
    columns.push([ 'BB', container['BB']['genotype-likelihood-phred-scaled'] ]);

    var chart = c3.generate({ 
                                bindto: '#' + chartId,
                                data:
                                    {
                                        type: 'donut',
                                        columns: columns
                                    },
                                tooltip:
                                    {
                                        show: false
                                    }
                            });

    return chartDiv;
}

// Pretty prints a JSON object:
function prettyPrintResult(container, result)
{
    var keys = [];
    for (var key in result)
    {
        if (result.hasOwnProperty(key))
        {
            keys.push(key);
        }
    }

    var el = $('<ul></ul>');
    container.append(el);

    for (var index in keys.sort())
    {
        var value = result[keys[index]];

        if (value instanceof Array)
        {
            var childContainer = $('<li class="objectlist"></li>')
                .append($('<strong></strong>').text(keys[index] + ': '))
                .append($(' <em>(list)</em>'));

            el.append(childContainer);
            prettyPrintResult(childContainer, value);
        }
        else if (value instanceof Object)
        {
            var childContainer = $('<li></li>');

            childContainer.text(keys[index]);
            el.append(childContainer);

            if (keys[index] == "samples")
            {
                plotSampleStats(value, el);
            }

            prettyPrintResult(childContainer, value);

            if (keys[index] == "BB" && !('AC' in result))
            {
                plotLikelihood(result, el);
            }
        }
        else
        {
            var childContainer = $('<li></li>');

            childContainer.append($('<strong></strong>').text(keys[index] + ': '));

            if (value != null)
            {
                childContainer.append($('<span></span>').text(value));
            }
            else
            {
                childContainer.append($('<em>empty</em>'));
            }

            el.append(childContainer);
        }
    }
}

// Executes a query (user pressed "Query" button):
function runQuery()
{
    var constraint = {};

    if ($('#value1').val() != "")
    {
        var field = $('#field1').val().split('.');

        if (field.length == 2)
        {
            constraint[field[0]] = {};
            constraint[field[0]][field[1]] = $('#value1').val();
        }
        else
        {
            constraint[field[0]] = $('#value1').val();
        }
    }

    $('#result').empty();

    $.ajax({
               type: "POST",
               url: "/query",
               data: JSON.stringify({
                       'limit' : $('#limit').val(),
                       'offset' : $('#offset').val(),
                       'constraint' : JSON.stringify(constraint)
                     }),
               contentType: "application/json; charset=utf-8",
               dataType: "json",
               success: function(data)
                   {
                       $('#result').empty();
                       for (index in data['result'])
                       {
                           prettyPrintResult($('#result'), data['result'][index]);
                           $('#result').append('<hr>');
                       }
                   },
               failure: function(errMsg) {
                   alert(errMsg);
               }
           });
}

