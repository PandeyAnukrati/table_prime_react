import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Paginator } from "primereact/paginator";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "./index.css";
import "./App.css";

function App() {
  const [artworks, setArtworks] = useState([]); // Current page data
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  // Store selected rows across pages
  const [selectedRows, setSelectedRows] = useState({});
  const [selectCount, setSelectCount] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const fetchArtworks = async (page) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const onPageChange = (e) => {
    setCurrentPage(e.page + 1); // Adjust 0-based index
  };

  const onRowSelectChange = (rowData, selected) => {
    const updatedSelections = { ...selectedRows };
    if (selected) {
      updatedSelections[rowData.id] = rowData;
    } else {
      delete updatedSelections[rowData.id];
    }
    setSelectedRows(updatedSelections);
  };

  const onSelectAllChange = (event) => {
    const checked = event.checked;
    const updatedSelections = { ...selectedRows };

    if (checked) {
      artworks.forEach((row) => {
        updatedSelections[row.id] = row;
      });
    } else {
      artworks.forEach((row) => {
        delete updatedSelections[row.id];
      });
    }
    setSelectedRows(updatedSelections);
  };

  const isRowSelected = (rowData) => !!selectedRows[rowData.id];

  const isPageSelected = () => {
    return artworks.length > 0 && artworks.every((row) => selectedRows[row.id]);
  };

  // Select N rows globally
  const selectNRows = async (count) => {
    setIsSelecting(true);
    try {
      const updatedSelections = { ...selectedRows };
      let fetched = 0;
      let page = 1;

      while (fetched < count) {
        const response = await fetch(
          `https://api.artic.edu/api/v1/artworks?page=${page}`
        );
        const data = await response.json();

        data.data.forEach((row) => {
          if (fetched < count) {
            updatedSelections[row.id] = row;
            fetched++;
          }
        });

        if (!data.pagination.next_url) break; // No more pages
        page++;
      }

      setSelectedRows(updatedSelections);
    } catch (error) {
      console.error("Error selecting rows:", error);
    } finally {
      setIsSelecting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Table Section */}
      <div className="table-container animate-fade-in">
        <div className="table-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-lg)",
            }}
          >
            <h2 className="table-title">Artwork Collection</h2>
            <div className="attribution">Made by Anukarti Pandey</div>
          </div>
          <div className="table-controls">
            <div className="select-input-group">
              <label htmlFor="selectCount">Select rows:</label>
              <InputNumber
                id="selectCount"
                value={selectCount}
                onValueChange={(e) => setSelectCount(e.value)}
                placeholder="Enter number"
                min={1}
                max={totalRecords}
                showButtons
                buttonLayout="horizontal"
                step={1}
                size="small"
              />
            </div>
            <Button
              label={isSelecting ? "Selecting..." : "Select N Rows"}
              className="btn-primary"
              onClick={() => selectNRows(selectCount)}
              disabled={!selectCount || loading || isSelecting}
              icon={
                isSelecting ? "pi pi-spin pi-spinner" : "pi pi-check-square"
              }
              loading={isSelecting}
              size="small"
            />
            {Object.keys(selectedRows).length > 0 && (
              <Button
                label={`Clear All (${Object.keys(selectedRows).length})`}
                className="btn-secondary"
                onClick={() => setSelectedRows({})}
                icon="pi pi-times"
                size="small"
              />
            )}
          </div>
        </div>

        <DataTable
          value={artworks}
          loading={loading}
          tableStyle={{ minWidth: "80rem" }}
          scrollable
          scrollHeight="60vh"
          selectionMode="checkbox"
          selection={Object.values(selectedRows)}
          onSelectionChange={(e) => {
            const newSelections = {};
            e.value.forEach((row) => {
              newSelections[row.id] = row;
            });
            setSelectedRows(newSelections);
          }}
          emptyMessage="No artworks found"
          className={loading ? "loading-overlay" : ""}
        >
          <Column
            selectionMode="multiple"
            headerStyle={{ width: "3rem" }}
            headerCheckboxSelected={isPageSelected()}
            onHeaderCheckboxChange={onSelectAllChange}
            body={(rowData) => (
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={isRowSelected(rowData)}
                onChange={(e) => onRowSelectChange(rowData, e.target.checked)}
              />
            )}
          />
          <Column
            field="title"
            header="Title"
            sortable
            body={(rowData) => (
              <div
                style={{
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rowData.title || "Untitled"}
              </div>
            )}
          />
          <Column
            field="place_of_origin"
            header="Origin"
            body={(rowData) => rowData.place_of_origin || "Unknown"}
          />
          <Column
            field="artist_display"
            header="Artist"
            body={(rowData) => (
              <div
                style={{
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rowData.artist_display || "Unknown Artist"}
              </div>
            )}
          />
          <Column
            field="date_start"
            header="Date Start"
            body={(rowData) => rowData.date_start || "N/A"}
          />
          <Column
            field="date_end"
            header="Date End"
            body={(rowData) => rowData.date_end || "N/A"}
          />
        </DataTable>

        <Paginator
          first={(currentPage - 1) * pageSize}
          rows={pageSize}
          totalRecords={totalRecords}
          onPageChange={onPageChange}
          className="custom-paginator"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} artworks"
        />
      </div>
    </div>
  );
}

export default App;
