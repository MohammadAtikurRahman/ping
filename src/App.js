import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Table,
  Pagination,
  Container,
  Form,
  FormControl,
  Button,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; // Import custom CSS for additional styling
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10); // Adjust as needed
  const [maxPageNumbers] = useState(5); // Maximum page numbers to display
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");

  const fetchData = async () => {
    try {
      const response = await axios.get("https://dexapi.metakave.com/get-tran");
      const sortedData = response.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setTransactions(sortedData);
      if (sortedData.length > 0) {
        toast.success("Data fetched successfully!");
      } else {
        toast.info("No data available.");
      }
    } catch (error) {
      toast.error("Error fetching data.");
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterTransactions = useCallback(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          (transaction.beneficiaryMobile &&
            transaction.beneficiaryMobile.includes(searchTerm)) ||
          (transaction.beneficiaryId &&
            transaction.beneficiaryId.toString().includes(searchTerm)) ||
          (transaction.trxid && transaction.trxid.includes(searchTerm)) ||
          (transaction.timestamp &&
            new Date(transaction.timestamp)
              .toLocaleString()
              .includes(searchTerm))
      );
    }

    if (selectedPhoneNumber) {
      filtered = filtered.filter(
        (transaction) => transaction.beneficiaryMobile === selectedPhoneNumber
      );
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  }, [searchTerm, transactions, selectedPhoneNumber]);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, transactions, selectedPhoneNumber, filterTransactions]);

  // Calculate how many minutes ago the data was synchronized
  const calculateMinutesAgo = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
    return `${diff} minutes ago`;
  };

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(
    filteredTransactions.length / transactionsPerPage
  );

  // Get the range of pagination numbers to display
  const getPageNumbers = () => {
    const start = Math.max(1, currentPage - Math.floor(maxPageNumbers / 2));
    const end = Math.min(totalPages, start + maxPageNumbers - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle phone number click
  const handlePhoneNumberClick = (phoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setSearchTerm(""); // Clear the search term when a phone number is clicked
  };

  // Get unique phone numbers
  const uniquePhoneNumbers = Array.from(
    new Set(transactions.map((t) => t.beneficiaryMobile))
  ).filter((phoneNumber) => phoneNumber);

  // Filter unique phone numbers based on search term
  const filteredUniquePhoneNumbers = searchTerm
    ? uniquePhoneNumbers.filter((phoneNumber) =>
        phoneNumber.includes(searchTerm)
      )
    : uniquePhoneNumbers;

  return (
    <Container>
      <ToastContainer />
      <h2 className="mt-4 mb-4 text-center">Transaction List</h2>
      <Form className="mb-4">
        <FormControl
          type="text"
          placeholder="Search by any parameter"
          className="mr-sm-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <hr />
        {selectedPhoneNumber && (
          <Button
            variant="danger"
            className="ml-2 w-100"
            onClick={() => setSelectedPhoneNumber("")}
          >
            Home
          </Button>
        )}
      </Form>
      {selectedPhoneNumber === "" ? (
        <Table striped bordered hover className="table-responsive">
          <thead>
            <tr>
              <th>#</th>
              <th>Beneficiary Mobile</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredUniquePhoneNumbers
              .slice(indexOfFirstTransaction, indexOfLastTransaction)
              .map((phoneNumber, index) => (
                <tr key={phoneNumber}>
                  <td>{index + 1 + indexOfFirstTransaction}</td>
                  <td>
                    <Button
                      variant="link"
                      onClick={() => handlePhoneNumberClick(phoneNumber)}
                    >
                      {phoneNumber}
                    </Button>
                  </td>
                  <td>Click to see details</td>
                </tr>
              ))}
          </tbody>
        </Table>
      ) : (
        currentTransactions.length > 0 && (
          <>
            <Table striped bordered hover className="table-responsive">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Beneficiary ID</th>
                  <th>Beneficiary Mobile</th>
                  <th>trxid</th>
                  <th>Timestamp</th>
                  <th>Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map((transaction, index) => (
                  <tr key={transaction._id}>
                    <td>{index + 1 + indexOfFirstTransaction}</td>
                    <td>{transaction.beneficiaryId}</td>
                    <td>{transaction.beneficiaryMobile}</td>
                    <td>{transaction.trxid}</td>
                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                    <td>{calculateMinutesAgo(transaction.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination className="justify-content-center mt-4">
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />
              {getPageNumbers().map((number) => (
                <Pagination.Item
                  key={number}
                  active={number === currentPage}
                  onClick={() => paginate(number)}
                >
                  {number}
                </Pagination.Item>
              ))}
              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </>
        )
      )}
    </Container>
  );
};

export default App;
