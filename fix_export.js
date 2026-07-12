const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

content = content.replace(
`      extraAction: () => exe  const handleExportToExcel = () => {`,
`      extraAction: () => executeResetDiagnosticDb()
    });
  };

  const handleExportToExcel = () => {`
);

content = content.replace(
`      onRequestToast("Failed to generate Excel export: " + error.message, "error");
    }
  }; + error.message, "error");
    }
  };`,
`      onRequestToast("Failed to generate Excel export: " + error.message, "error");
    }
  };`
);

fs.writeFileSync('src/components/AdminView.tsx', content);
