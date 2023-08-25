import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { Button, Container, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'; 

const UploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData>({ items: [] });
  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false);


  
  useEffect(() => {
    fetchData(); 
  }, []);

  interface Items {
    name: string;
    email: string;
    phone: string;
  }
  
  interface UploadedData {
    items: Items[];
  }
  

  async function fetchData() {
    try {
      
      const response = await axios.get(
        'https://8j5baasof2.execute-api.us-west-2.amazonaws.com/production/tests/trucode/items'
      );
      
      setUploadedData(response.data); 
      
      
    } catch (error) {
      console.log(error);
    }
  }

 

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  function formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, ''); 
  
    if (cleaned.length === 9) {
      const areaCode = cleaned.slice(0, 2);
      const middlePart = cleaned.slice(2, 5);
      const lastPart = cleaned.slice(5);
      return `${areaCode}-${middlePart}-${lastPart}`;
    } else if (cleaned.length === 10) {
      const areaCode = cleaned.slice(0, 3);
    const firstPart = cleaned.slice(3, 6);
    const secondPart = cleaned.slice(6);
    return `${areaCode}-${firstPart}-${secondPart}`;
    }
  
    // Devuelve el número sin cambios si no cumple con las condiciones
    return phoneNumber;
  }
  
  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

   
    if (file) {
      
        const formData = new FormData();
        formData.append('csv', file);
    
        setUploadInProgress(true);
    
        try {
          // Lee el contenido del archivo utilizando FileReader
          const fileReader = new FileReader();
          fileReader.onload = async (event) => {
            const csvContent = event.target?.result as string;
    
            // Agrega comillas a los encabezados
            const csvWithQuotedHeaders = `"name","phone","email"\n${csvContent}`;
    
            // Parsea el contenido modificado del CSV a objetos JSON
            Papa.parse(csvWithQuotedHeaders, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: true,
              complete: async (result) => {
                const jsonData = result.data.map((contact: any) => ({
                  "name": contact.name,
                  "email": contact.email,
                  "phone": formatPhoneNumber(contact.phone.toString()),
                }));
    
                for (const contact of jsonData) {
                  try {
                    console.log(contact)
                    await axios.post(
                      'https://8j5baasof2.execute-api.us-west-2.amazonaws.com/production/tests/trucode/items',
                      contact,
                      {
                        headers: {
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                
                    
                  } catch (error) {
                    console.log(error);
                  }
                }
    
                setUploadInProgress(false);
              },
            });
          };
    
          fileReader.readAsText(file); // Lee el archivo como texto
        } catch (error) {
          console.log(error);
          setUploadInProgress(false);
        }
      }
    };

    return (
      <Container maxWidth="md" style={{"marginBottom": "30px"}}>
        <Typography variant="h4" gutterBottom style={{"marginBottom": "50px", "marginTop": "50px"}}>
          Lista de contactos
        </Typography>
        <Grid container spacing={3} style={{"marginBottom":"30px"}}> 
        <Grid item xs={12} style={{"marginBottom": "10px"}}> 
          <form onSubmit={handleSubmit}>
          
            <input type="file" accept=".csv" onChange={handleFileChange} />
            <Button style={{"marginLeft": "3%"}}variant="contained" color="primary" type="submit">
              Subir
            </Button>
          </form>
        </Grid>
      </Grid>
        {uploadedData.items.length > 0 && (
          <div>
            <Typography style={{"marginBottom":"20px"}} variant="h4" gutterBottom>
              Datos Subidos Exitosamente
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Teléfono</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadedData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.phone}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Container>
    );
  };
  
  export default UploadForm;
